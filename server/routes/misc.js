const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const n = (v) => (v === undefined || v === '') ? null : v;
const num = (v, def = 0) => (v === undefined || v === null || v === '') ? def : Number(v);
const bool = (v) => v ? true : false;

// PROJECTS
const projectsRouter = express.Router();
projectsRouter.use(authMiddleware);

projectsRouter.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM projects WHERE user_id=$1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.post('/', async (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4(); const f = req.body;
    await db.query('INSERT INTO projects (id,user_id,name,description,tech_stack,deployment_url,github_url,status,current_phase,phase_index,interview_explanation,core_feature,optional_feature,system_design_applied) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id,req.userId,n(f.name)||'',n(f.description),n(f.tech_stack),n(f.deployment_url),n(f.github_url),n(f.status)||'In Progress',n(f.current_phase)||'Auth',num(f.phase_index),n(f.interview_explanation),n(f.core_feature),n(f.optional_feature),n(f.system_design_applied)]);
    const result = await db.query('SELECT * FROM projects WHERE id=$1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.patch('/:id', async (req, res) => {
  try {
    const db = getDb(); const f = req.body;
    await db.query('UPDATE projects SET name=$1,description=$2,tech_stack=$3,deployment_url=$4,github_url=$5,status=$6,current_phase=$7,phase_index=$8,interview_explanation=$9,core_feature=$10,optional_feature=$11,system_design_applied=$12,updated_at=NOW() WHERE id=$13 AND user_id=$14',
      [n(f.name),n(f.description),n(f.tech_stack),n(f.deployment_url),n(f.github_url),n(f.status),n(f.current_phase),num(f.phase_index),n(f.interview_explanation),n(f.core_feature),n(f.optional_feature),n(f.system_design_applied),req.params.id,req.userId]);
    const result = await db.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// GOALS
const goalsRouter = express.Router();
goalsRouter.use(authMiddleware);

goalsRouter.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM goals WHERE user_id=$1 ORDER BY target_date ASC NULLS LAST', [req.userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.post('/', async (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4(); const f = req.body;
    await db.query('INSERT INTO goals (id,user_id,title,description,target_date,progress_pct,status,category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [id,req.userId,n(f.title)||'',n(f.description),n(f.target_date),num(f.progress_pct),n(f.status)||'Active',n(f.category)||'Career']);
    const result = await db.query('SELECT * FROM goals WHERE id=$1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.patch('/:id', async (req, res) => {
  try {
    const db = getDb(); const f = req.body;
    await db.query('UPDATE goals SET title=$1,description=$2,target_date=$3,progress_pct=$4,status=$5,category=$6,updated_at=NOW() WHERE id=$7 AND user_id=$8',
      [n(f.title),n(f.description),n(f.target_date),num(f.progress_pct),n(f.status),n(f.category),req.params.id,req.userId]);
    const result = await db.query('SELECT * FROM goals WHERE id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM goals WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// TIMERS
const timersRouter = express.Router();
timersRouter.use(authMiddleware);

timersRouter.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM timers WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

timersRouter.post('/', async (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4(); const f = req.body;
    await db.query('INSERT INTO timers (id,user_id,name,type,duration_seconds,deadline_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [id,req.userId,n(f.name),n(f.type)||'Pomodoro',num(f.duration_seconds,1500),f.deadline_at ? new Date(f.deadline_at) : null]);
    const result = await db.query('SELECT * FROM timers WHERE id=$1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

timersRouter.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('UPDATE timers SET is_active=false WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// AUDIT
const auditRouter = express.Router();
auditRouter.use(authMiddleware);

auditRouter.get('/', async (req, res) => {
  try {
    const db = getDb();
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const computed = await db.query('SELECT SUM(dsa_count) as dsa_total, SUM(apps_sent) as apps_total, AVG(total_score) as avg_score, AVG(energy_score) as avg_energy FROM daily_logs WHERE user_id=$1 AND log_date>=$2', [req.userId, weekStartStr]);
    const saved = await db.query('SELECT * FROM weekly_audits WHERE user_id=$1 ORDER BY week_start DESC LIMIT 8', [req.userId]);
    res.json({ computed: computed.rows[0] || {}, saved: saved.rows, weekStart: weekStartStr });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

auditRouter.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { week_start, what_failed, root_cause, fix_next_week } = req.body;
    const computed = await db.query('SELECT SUM(dsa_count) as dsa_total, SUM(apps_sent) as apps_total, AVG(total_score) as avg_score, AVG(energy_score) as avg_energy FROM daily_logs WHERE user_id=$1 AND log_date>=$2', [req.userId, n(week_start)||'2000-01-01']);
    const c = computed.rows[0] || {};
    await db.query('INSERT INTO weekly_audits (id,user_id,week_start,dsa_total,apps_total,avg_score,avg_energy,what_failed,root_cause,fix_next_week) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (user_id,week_start) DO UPDATE SET what_failed=$8,root_cause=$9,fix_next_week=$10',
      [uuidv4(),req.userId,n(week_start),num(c.dsa_total),num(c.apps_total),num(c.avg_score),num(c.avg_energy),n(what_failed),n(root_cause),n(fix_next_week)]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// NETWORK
const networkRouter = express.Router();
networkRouter.use(authMiddleware);

networkRouter.get('/', async (req, res) => {
  try {
    const db = getDb();
    const contacts = await db.query('SELECT * FROM network_contacts WHERE user_id=$1 ORDER BY contacted_at DESC', [req.userId]);
    const stats = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN referral_requested THEN 1 ELSE 0 END) as refs_requested, SUM(CASE WHEN referral_received THEN 1 ELSE 0 END) as refs_received FROM network_contacts WHERE user_id=$1', [req.userId]);
    res.json({ contacts: contacts.rows, stats: stats.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.post('/', async (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4(); const f = req.body;
    await db.query('INSERT INTO network_contacts (id,user_id,name,company,role,platform,message_sent,referral_requested,followup_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [id,req.userId,n(f.name)||'',n(f.company),n(f.role),n(f.platform),bool(f.message_sent),bool(f.referral_requested),n(f.followup_date),n(f.notes)]);
    const result = await db.query('SELECT * FROM network_contacts WHERE id=$1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.patch('/:id', async (req, res) => {
  try {
    const db = getDb(); const f = req.body;
    await db.query('UPDATE network_contacts SET name=$1,company=$2,role=$3,platform=$4,message_sent=$5,referral_requested=$6,referral_received=$7,response_received=$8,followup_date=$9,notes=$10 WHERE id=$11 AND user_id=$12',
      [n(f.name),n(f.company),n(f.role),n(f.platform),bool(f.message_sent),bool(f.referral_requested),bool(f.referral_received),bool(f.response_received),n(f.followup_date),n(f.notes),req.params.id,req.userId]);
    const result = await db.query('SELECT * FROM network_contacts WHERE id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM network_contacts WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = { projectsRouter, networkRouter, goalsRouter, timersRouter, auditRouter };
