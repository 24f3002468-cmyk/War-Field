const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all problems + topics
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const problems = db.prepare('SELECT * FROM dsa_problems WHERE user_id = ? ORDER BY solved_at DESC LIMIT 50').all(req.userId);
    const topics = db.prepare('SELECT * FROM dsa_topics WHERE user_id = ? ORDER BY topic').all(req.userId);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekCount = db.prepare("SELECT COUNT(*) as cnt FROM dsa_problems WHERE user_id = ? AND solved_at >= ?").get(req.userId, weekStart.toISOString());
    res.json({ problems, topics, weekCount: weekCount ? weekCount.cnt : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add problem
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, difficulty, topic, insight, needs_revision } = req.body;
    if (!name || !difficulty || !topic) return res.status(400).json({ error: 'Name, difficulty, topic required' });

    const id = uuidv4();
    db.prepare('INSERT INTO dsa_problems (id, user_id, name, difficulty, topic, insight, needs_revision) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.userId, name, difficulty, topic, insight || '', needs_revision ? 1 : 0);

    // Update topic mastery
    const existing = db.prepare('SELECT * FROM dsa_topics WHERE user_id = ? AND topic = ?').get(req.userId, topic);
    if (existing) {
      const diffCol = difficulty === 'Easy' ? 'easy_count' : difficulty === 'Medium' ? 'medium_count' : 'hard_count';
      const newTotal = existing.total_solved + 1;
      const newDiff = existing[diffCol] + 1;
      const mastery = Math.min(100, Math.round((newTotal * 5) + (existing.hard_count * 5) + (existing.medium_count * 2)));
      db.prepare(`UPDATE dsa_topics SET total_solved = ?, ${diffCol} = ?, mastery_score = ?, last_practiced = datetime('now') WHERE user_id = ? AND topic = ?`).run(newTotal, newDiff, mastery, req.userId, topic);
    } else {
      db.prepare("INSERT INTO dsa_topics (id, user_id, topic, total_solved, mastery_score, last_practiced) VALUES (?, ?, ?, 1, 10, datetime('now'))").run(uuidv4(), req.userId, topic);
    }

    const problem = db.prepare('SELECT * FROM dsa_problems WHERE id = ?').get(id);
    res.status(201).json(problem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete problem
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM dsa_problems WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update revision flag
router.patch('/:id/revision', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE dsa_problems SET needs_revision = ? WHERE id = ? AND user_id = ?').run(req.body.needs_revision ? 1 : 0, req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
