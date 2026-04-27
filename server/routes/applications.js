const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const n = (v) => (v === undefined || v === '') ? null : v;

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const apps = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY applied_at DESC').all(req.userId);
    const stats = db.prepare(`SELECT COUNT(*) as total,
      SUM(CASE WHEN status='Applied' THEN 1 ELSE 0 END) as applied,
      SUM(CASE WHEN status='In Review' THEN 1 ELSE 0 END) as in_review,
      SUM(CASE WHEN status='OA Received' THEN 1 ELSE 0 END) as oa,
      SUM(CASE WHEN status='Interview' THEN 1 ELSE 0 END) as interview,
      SUM(CASE WHEN status='Final Round' THEN 1 ELSE 0 END) as final_round,
      SUM(CASE WHEN status='Offer' THEN 1 ELSE 0 END) as offer,
      SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN referral!='None' THEN 1 ELSE 0 END) as with_referral,
      SUM(CASE WHEN quality='High Quality' THEN 1 ELSE 0 END) as high_quality
      FROM applications WHERE user_id = ?`).get(req.userId);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekTotal = db.prepare("SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND applied_at >= ?").get(req.userId, weekStart.toISOString().split('T')[0]);
    res.json({ apps, stats, weekTotal: weekTotal ? weekTotal.cnt : 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { company, role, quality, referral, status, followup_date, notes } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role required' });
    const id = uuidv4();
    db.prepare('INSERT INTO applications (id,user_id,company,role,quality,referral,status,followup_date,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(id, req.userId, company, role, n(quality)||'Normal', n(referral)||'None', n(status)||'Applied', n(followup_date), n(notes));
    res.status(201).json(db.prepare('SELECT * FROM applications WHERE id=?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const { company, role, quality, referral, status, followup_date, notes } = req.body;
    db.prepare("UPDATE applications SET company=?,role=?,quality=?,referral=?,status=?,followup_date=?,notes=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(n(company), n(role), n(quality), n(referral), n(status), n(followup_date), n(notes), req.params.id, req.userId);
    res.json(db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM applications WHERE id=? AND user_id=?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
