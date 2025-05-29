const express = require('express');
const router = express.Router();
const db = require('../modules/db'); // Adjust path based on your project

// 1. Add a new log
router.post('/', async (req, res) => {
  const { livestock_id, log_date, feed, production, symptoms } = req.body;

  try {
    const [result] = await db.execute(
      'INSERT INTO livestock_logs (livestock_id, log_date, feed, production, symptoms) VALUES (?, ?, ?, ?, ?)',
      [livestock_id, log_date, feed, production, symptoms]
    );
    res.status(201).json({ message: 'Log added successfully', log_id: result.insertId });
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Get logs for a specific livestock
router.get('/:livestock_id', async (req, res) => {
  const { livestock_id } = req.params;

  try {
    const [logs] = await db.execute(
      'SELECT * FROM livestock_logs WHERE livestock_id = ? ORDER BY log_date DESC',
      [livestock_id]
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Filter logs by date/week/month
router.post('/filter/:livestock_id', async (req, res) => {
  const { livestock_id } = req.params;
  const { startDate, endDate } = req.body;

  try {
    const [logs] = await db.execute(
      'SELECT * FROM livestock_logs WHERE livestock_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC',
      [livestock_id, startDate, endDate]
    );
    res.json(logs);
  } catch (error) {
    console.error('Error filtering logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Edit a log
router.put('/:log_id', async (req, res) => {
  const { log_id } = req.params;
  const { log_date, feed, production, symptoms } = req.body;

  try {
    await db.execute(
      'UPDATE livestock_logs SET log_date = ?, feed = ?, production = ?, symptoms = ? WHERE id = ?',
      [log_date, feed, production, symptoms, log_id]
    );
    res.json({ message: 'Log updated successfully' });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Delete a log
router.delete('/:log_id', async (req, res) => {
  const { log_id } = req.params;

  try {
    await db.execute('DELETE FROM livestock_logs WHERE id = ?', [log_id]);
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
