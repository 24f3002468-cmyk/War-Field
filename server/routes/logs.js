const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const n = (v) => (v === undefined || v === '') ? null : v;
const num = (v, def = 0) => (v === undefined || v === null || v === '') ? def : Number(v);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare("SELECT * FROM daily_logs WHERE user_id=? ORDER BY log_date DESC LIMIT 30").all(req.userId));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/today', (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const log = db.prepare('SELECT * FROM daily_logs WHERE user_id=? AND log_date=?').get(req.userId, today);
    const checklist = db.prepare('SELECT * FROM checklist_items WHERE user_id=? AND log_date=? ORDER BY item_index').all(req.userId, today);
    res.json({ log: log || null, checklist });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { log_date, day_type, energy_score, dsa_score, project_score, career_score, discipline_score, dsa_count, apps_sent, features_built, system_design_topic, deep_work_hours, notes, reflection } = req.body;
    const date = n(log_date) || new Date().toISOString().split('T')[0];
    const total = num(dsa_score) + num(project_score) + num(career_score) + num(discipline_score);

    const existing = db.prepare('SELECT id FROM daily_logs WHERE user_id=? AND log_date=?').get(req.userId, date);
    if (existing) {
      db.prepare("UPDATE daily_logs SET day_type=?,energy_score=?,dsa_score=?,project_score=?,career_score=?,discipline_score=?,total_score=?,dsa_count=?,apps_sent=?,features_built=?,system_design_topic=?,deep_work_hours=?,notes=?,reflection=?,updated_at=datetime('now') WHERE user_id=? AND log_date=?")
        .run(n(day_type), num(energy_score), num(dsa_score), num(project_score), num(career_score), num(discipline_score), total, num(dsa_count), num(apps_sent), n(features_built), n(system_design_topic), num(deep_work_hours), n(notes), n(reflection), req.userId, date);
    } else {
      const id = uuidv4();
      db.prepare("INSERT INTO daily_logs (id,user_id,log_date,day_type,energy_score,dsa_score,project_score,career_score,discipline_score,total_score,dsa_count,apps_sent,features_built,system_design_topic,deep_work_hours,notes,reflection) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(id, req.userId, date, n(day_type), num(energy_score), num(dsa_score), num(project_score), num(career_score), num(discipline_score), total, num(dsa_count), num(apps_sent), n(features_built), n(system_design_topic), num(deep_work_hours), n(notes), n(reflection));
    }
    res.json({ success: true, total_score: total });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/checklist', (req, res) => {
  try {
    const db = getDb();
    const { log_date, item_index, item_text, completed } = req.body;
    const id = uuidv4();
    db.prepare('INSERT OR REPLACE INTO checklist_items (id,user_id,log_date,item_index,item_text,completed) VALUES (?,?,?,?,?,?)').run(id, req.userId, log_date, num(item_index), n(item_text)||'', completed ? 1 : 0);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics', (req, res) => {
  try {
    const db = getDb();
    const scores = db.prepare("SELECT log_date,total_score,energy_score,dsa_score,project_score,career_score,discipline_score,dsa_count,apps_sent FROM daily_logs WHERE user_id=? ORDER BY log_date DESC LIMIT 14").all(req.userId);
    const weekAvg = db.prepare("SELECT AVG(total_score) as avg_score, AVG(energy_score) as avg_energy, SUM(dsa_count) as total_dsa, SUM(apps_sent) as total_apps FROM daily_logs WHERE user_id=? AND log_date >= date('now','-7 days')").get(req.userId);
    res.json({ scores, weekAvg: weekAvg || {} });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
