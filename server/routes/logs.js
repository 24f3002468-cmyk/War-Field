const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
const n = (v) => (v === undefined || v === '') ? null : v;
const num = (v, def = 0) => (v === undefined || v === null || v === '') ? def : Number(v);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM daily_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 30', [req.userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/today', async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const log = await db.query('SELECT * FROM daily_logs WHERE user_id=$1 AND log_date=$2', [req.userId, today]);
    const checklist = await db.query('SELECT * FROM checklist_items WHERE user_id=$1 AND log_date=$2 ORDER BY item_index', [req.userId, today]);
    res.json({ log: log.rows[0] || null, checklist: checklist.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { log_date, day_type, energy_score, dsa_score, project_score, career_score, discipline_score, dsa_count, apps_sent, features_built, system_design_topic, deep_work_hours, notes, reflection } = req.body;
    const date = n(log_date) || new Date().toISOString().split('T')[0];
    const total = num(dsa_score) + num(project_score) + num(career_score) + num(discipline_score);

    const existing = await db.query('SELECT id FROM daily_logs WHERE user_id=$1 AND log_date=$2', [req.userId, date]);
    if (existing.rows.length) {
      await db.query(`UPDATE daily_logs SET day_type=$1,energy_score=$2,dsa_score=$3,project_score=$4,career_score=$5,discipline_score=$6,total_score=$7,dsa_count=$8,apps_sent=$9,features_built=$10,system_design_topic=$11,deep_work_hours=$12,notes=$13,reflection=$14,updated_at=NOW() WHERE user_id=$15 AND log_date=$16`,
        [n(day_type),num(energy_score),num(dsa_score),num(project_score),num(career_score),num(discipline_score),total,num(dsa_count),num(apps_sent),n(features_built),n(system_design_topic),num(deep_work_hours),n(notes),n(reflection),req.userId,date]);
    } else {
      await db.query(`INSERT INTO daily_logs (id,user_id,log_date,day_type,energy_score,dsa_score,project_score,career_score,discipline_score,total_score,dsa_count,apps_sent,features_built,system_design_topic,deep_work_hours,notes,reflection) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [uuidv4(),req.userId,date,n(day_type),num(energy_score),num(dsa_score),num(project_score),num(career_score),num(discipline_score),total,num(dsa_count),num(apps_sent),n(features_built),n(system_design_topic),num(deep_work_hours),n(notes),n(reflection)]);
    }
    res.json({ success: true, total_score: total });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/checklist', async (req, res) => {
  try {
    const db = getDb();
    const { log_date, item_index, item_text, completed } = req.body;
    await db.query('INSERT INTO checklist_items (id,user_id,log_date,item_index,item_text,completed) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
      [uuidv4(), req.userId, log_date, num(item_index), n(item_text)||'', completed || false]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics', async (req, res) => {
  try {
    const db = getDb();
    const scores = await db.query('SELECT log_date,total_score,energy_score,dsa_score,project_score,career_score,discipline_score,dsa_count,apps_sent FROM daily_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 14', [req.userId]);
    const weekAvg = await db.query("SELECT AVG(total_score) as avg_score, AVG(energy_score) as avg_energy, SUM(dsa_count) as total_dsa, SUM(apps_sent) as total_apps FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE - INTERVAL '7 days'", [req.userId]);
    res.json({ scores: scores.rows, weekAvg: weekAvg.rows[0] || {} });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
