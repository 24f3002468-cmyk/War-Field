const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const problems = await db.query('SELECT * FROM dsa_problems WHERE user_id = $1 ORDER BY solved_at DESC LIMIT 50', [req.userId]);
    const topics = await db.query('SELECT * FROM dsa_topics WHERE user_id = $1 ORDER BY topic', [req.userId]);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
    const weekCount = await db.query('SELECT COUNT(*) as cnt FROM dsa_problems WHERE user_id = $1 AND solved_at >= $2', [req.userId, weekStart.toISOString()]);
    res.json({ problems: problems.rows, topics: topics.rows, weekCount: parseInt(weekCount.rows[0].cnt) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { name, difficulty, topic, insight, needs_revision } = req.body;
    if (!name || !difficulty || !topic) return res.status(400).json({ error: 'Name, difficulty, topic required' });

    const id = uuidv4();
    await db.query('INSERT INTO dsa_problems (id,user_id,name,difficulty,topic,insight,needs_revision) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, req.userId, name, difficulty, topic, insight || '', needs_revision || false]);

    const existing = await db.query('SELECT * FROM dsa_topics WHERE user_id = $1 AND topic = $2', [req.userId, topic]);
    if (existing.rows.length) {
      const t = existing.rows[0];
      const diffCol = difficulty === 'Easy' ? 'easy_count' : difficulty === 'Medium' ? 'medium_count' : 'hard_count';
      const newTotal = t.total_solved + 1;
      const mastery = Math.min(100, Math.round((newTotal * 5) + (t.hard_count * 5) + (t.medium_count * 2)));
      await db.query(`UPDATE dsa_topics SET total_solved=$1, ${diffCol}=${diffCol}+1, mastery_score=$2, last_practiced=NOW() WHERE user_id=$3 AND topic=$4`,
        [newTotal, mastery, req.userId, topic]);
    } else {
      await db.query('INSERT INTO dsa_topics (id,user_id,topic,total_solved,mastery_score,last_practiced) VALUES ($1,$2,$3,1,10,NOW())',
        [uuidv4(), req.userId, topic]);
    }

    const result = await db.query('SELECT * FROM dsa_problems WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.patch('/:id/revision', async (req, res) => {
  try {
    const db = getDb();
    await db.query('UPDATE dsa_problems SET needs_revision=$1 WHERE id=$2 AND user_id=$3',
      [req.body.needs_revision || false, req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM dsa_problems WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
