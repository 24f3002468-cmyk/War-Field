const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const n = (v) => (v === undefined || v === '') ? null : v;
const num = (v, def = 0) => (v === undefined || v === null || v === '') ? def : Number(v);
const bool = (v) => v ? 1 : 0;

// ─── PROJECTS ───────────────────────────────────────────────────
const projectsRouter = express.Router();
projectsRouter.use(authMiddleware);

projectsRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM projects WHERE user_id=? ORDER BY created_at DESC').all(req.userId));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const f = req.body;
    db.prepare("INSERT INTO projects (id,user_id,name,description,tech_stack,deployment_url,github_url,status,current_phase,phase_index,interview_explanation,core_feature,optional_feature,system_design_applied) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(id, req.userId, n(f.name)||'', n(f.description), n(f.tech_stack), n(f.deployment_url), n(f.github_url), n(f.status)||'In Progress', n(f.current_phase)||'Auth', num(f.phase_index), n(f.interview_explanation), n(f.core_feature), n(f.optional_feature), n(f.system_design_applied));
    res.status(201).json(db.prepare('SELECT * FROM projects WHERE id=?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const f = req.body;
    db.prepare("UPDATE projects SET name=?,description=?,tech_stack=?,deployment_url=?,github_url=?,status=?,current_phase=?,phase_index=?,interview_explanation=?,core_feature=?,optional_feature=?,system_design_applied=?,updated_at=datetime('now') WHERE id=? AND user_id=?")
      .run(n(f.name), n(f.description), n(f.tech_stack), n(f.deployment_url), n(f.github_url), n(f.status), n(f.current_phase), num(f.phase_index), n(f.interview_explanation), n(f.core_feature), n(f.optional_feature), n(f.system_design_applied), req.params.id, req.userId);
    res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

projectsRouter.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── NETWORK ────────────────────────────────────────────────────
const networkRouter = express.Router();
networkRouter.use(authMiddleware);

networkRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM network_contacts WHERE user_id=? ORDER BY contacted_at DESC').all(req.userId);
    const stats = db.prepare('SELECT COUNT(*) as total, SUM(referral_requested) as refs_requested, SUM(referral_received) as refs_received, SUM(response_received) as responses FROM network_contacts WHERE user_id=?').get(req.userId);
    res.json({ contacts, stats });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const f = req.body;
    db.prepare('INSERT INTO network_contacts (id,user_id,name,company,role,platform,message_sent,referral_requested,followup_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, req.userId, n(f.name)||'', n(f.company), n(f.role), n(f.platform), bool(f.message_sent), bool(f.referral_requested), n(f.followup_date), n(f.notes));
    res.status(201).json(db.prepare('SELECT * FROM network_contacts WHERE id=?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const f = req.body;
    db.prepare('UPDATE network_contacts SET name=?,company=?,role=?,platform=?,message_sent=?,referral_requested=?,referral_received=?,response_received=?,followup_date=?,notes=? WHERE id=? AND user_id=?')
      .run(n(f.name), n(f.company), n(f.role), n(f.platform), bool(f.message_sent), bool(f.referral_requested), bool(f.referral_received), bool(f.response_received), n(f.followup_date), n(f.notes), req.params.id, req.userId);
    res.json(db.prepare('SELECT * FROM network_contacts WHERE id=?').get(req.params.id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

networkRouter.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM network_contacts WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── GOALS ──────────────────────────────────────────────────────
const goalsRouter = express.Router();
goalsRouter.use(authMiddleware);

goalsRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM goals WHERE user_id=? ORDER BY target_date ASC').all(req.userId));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const f = req.body;
    db.prepare('INSERT INTO goals (id,user_id,title,description,target_date,progress_pct,status,category) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, req.userId, n(f.title)||'', n(f.description), n(f.target_date), num(f.progress_pct), n(f.status)||'Active', n(f.category)||'Career');
    res.status(201).json(db.prepare('SELECT * FROM goals WHERE id=?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const f = req.body;
    db.prepare("UPDATE goals SET title=?,description=?,target_date=?,progress_pct=?,status=?,category=?,updated_at=datetime('now') WHERE id=? AND user_id=?")
      .run(n(f.title), n(f.description), n(f.target_date), num(f.progress_pct), n(f.status), n(f.category), req.params.id, req.userId);
    res.json(db.prepare('SELECT * FROM goals WHERE id=?').get(req.params.id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

goalsRouter.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── TIMERS ─────────────────────────────────────────────────────
const timersRouter = express.Router();
timersRouter.use(authMiddleware);

timersRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM timers WHERE user_id=? AND is_active=1 ORDER BY created_at DESC').all(req.userId));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

timersRouter.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const f = req.body;
    db.prepare('INSERT INTO timers (id,user_id,name,type,duration_seconds,deadline_at) VALUES (?,?,?,?,?,?)')
      .run(id, req.userId, n(f.name), n(f.type)||'Pomodoro', num(f.duration_seconds, 1500), n(f.deadline_at));
    res.status(201).json(db.prepare('SELECT * FROM timers WHERE id=?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

timersRouter.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE timers SET is_active=0 WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── AUDIT ──────────────────────────────────────────────────────
const auditRouter = express.Router();
auditRouter.use(authMiddleware);

auditRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const computed = db.prepare("SELECT SUM(dsa_count) as dsa_total, SUM(apps_sent) as apps_total, AVG(total_score) as avg_score, AVG(energy_score) as avg_energy FROM daily_logs WHERE user_id=? AND log_date>=?").get(req.userId, weekStartStr);
    const saved = db.prepare('SELECT * FROM weekly_audits WHERE user_id=? ORDER BY week_start DESC LIMIT 8').all(req.userId);
    res.json({ computed: computed || {}, saved, weekStart: weekStartStr });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

auditRouter.post('/', (req, res) => {
  try {
    const db = getDb();
    const { week_start, what_failed, root_cause, fix_next_week } = req.body;
    const id = uuidv4();
    const computed = db.prepare("SELECT SUM(dsa_count) as dsa_total, SUM(apps_sent) as apps_total, AVG(total_score) as avg_score, AVG(energy_score) as avg_energy FROM daily_logs WHERE user_id=? AND log_date>=?").get(req.userId, n(week_start)||'2000-01-01');
    db.prepare('INSERT OR REPLACE INTO weekly_audits (id,user_id,week_start,dsa_total,apps_total,avg_score,avg_energy,what_failed,root_cause,fix_next_week) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, req.userId, n(week_start), num(computed?.dsa_total), num(computed?.apps_total), num(computed?.avg_score), num(computed?.avg_energy), n(what_failed), n(root_cause), n(fix_next_week));
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = { projectsRouter, networkRouter, goalsRouter, timersRouter, auditRouter };
