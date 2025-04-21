const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Uložení polohy
router.post('/', (req, res) => {
  const { chat_room_id, user_id, latitude, longitude } = req.body;

  db.query(
    'INSERT INTO locations (chat_room_id, user_id, latitude, longitude) VALUES (?, ?, ?, ?)',
    [chat_room_id, user_id, latitude, longitude],
    (err) => {
      if (err) return res.status(500).json({ message: 'Location save failed' });
      res.json({ message: 'Location saved' });
    }
  );
});

// Získání poslední známé polohy uživatelů v místnosti
router.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  db.query(
    'SELECT user_id, latitude, longitude FROM locations WHERE chat_room_id = ? ORDER BY created_at DESC',
    [roomId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Location load failed' });

      const latest = {};
      results.forEach(row => {
        if (!latest[row.user_id]) latest[row.user_id] = row;
      });

      res.json(Object.values(latest));
    }
  );
});

module.exports = router;
