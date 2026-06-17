const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
const n = (v) => (v === undefined || v === '') ? null : v;

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const apps = await db.query('SELECT * FROM applications WHERE user_id=$1 ORDER BY applied_at DESC', [req.userId]);
    const stats = await db.query(`SELECT COUNT(*) as total,
      SUM(CASE WHEN status='Applied' THEN 1 ELSE 0 END) as applied,
      SUM(CASE WHEN status='Interview' THEN 1 ELSE 0 END) as interview,
      SUM(CASE WHEN status='Offer' THEN 1 ELSE 0 END) as offer,
      SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN referral!='None' THEN 1 ELSE 0 END) as with_referral,
      SUM(CASE WHEN quality='High Quality' THEN 1 ELSE 0 END) as high_quality
      FROM applications WHERE user_id=$1`, [req.userId]);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekTotal = await db.query('SELECT COUNT(*) as cnt FROM applications WHERE user_id=$1 AND applied_at>=$2',
      [req.userId, weekStart.toISOString().split('T')[0]]);
    res.json({ apps: apps.rows, stats: stats.rows[0], weekTotal: parseInt(weekTotal.rows[0].cnt) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { company, role, quality, referral, status, followup_date, notes } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role required' });
    const id = uuidv4();
    await db.query('INSERT INTO applications (id,user_id,company,role,quality,referral,status,followup_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, req.userId, company, role, n(quality)||'Normal', n(referral)||'None', n(status)||'Applied', n(followup_date), n(notes)]);
    const result = await db.query('SELECT * FROM applications WHERE id=$1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { company, role, quality, referral, status, followup_date, notes } = req.body;
    await db.query('UPDATE applications SET company=$1,role=$2,quality=$3,referral=$4,status=$5,followup_date=$6,notes=$7,updated_at=NOW() WHERE id=$8 AND user_id=$9',
      [n(company), n(role), n(quality), n(referral), n(status), n(followup_date), n(notes), req.params.id, req.userId]);
    const result = await db.query('SELECT * FROM applications WHERE id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM applications WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
