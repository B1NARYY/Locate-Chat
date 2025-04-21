const express = require('express');
const router = express.Router();
const db = require('../services/db');
const crypto = require('crypto');

// Generate basic random code
function generateRoomCode(length = 6) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, length);
}

// Ensure code is unique in DB
async function generateUniqueCode(db, length = 6, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateRoomCode(length);
    const [rows] = await db.promise().query('SELECT id FROM chat_rooms WHERE code = ?', [code]);
    if (rows.length === 0) {
      return code;
    }
  }
  return null; // Failed to generate unique code
}

// Get all rooms
router.get('/', (req, res) => {
  db.query('SELECT * FROM chat_rooms', (err, results) => {
    if (err) {
      console.error("Error loading rooms:", err);
      return res.status(500).json({ message: 'Error loading rooms' });
    }
    res.json(results);
  });
});

// Create new room with guaranteed unique code
router.post('/', async (req, res) => {
  const { name, owner_id, is_public = true, profanity_filter = false } = req.body;

  if (!name || !owner_id) {
    return res.status(400).json({ message: 'Missing room name or owner ID' });
  }

  const code = await generateUniqueCode(db);
  if (!code) {
    return res.status(500).json({ message: 'Failed to generate unique code' });
  }

  db.query(
    'INSERT INTO chat_rooms (name, owner_id, is_public, profanity_filter, code) VALUES (?, ?, ?, ?, ?)',
    [name, owner_id, is_public ? 1 : 0, profanity_filter ? 1 : 0, code],
    (err, result) => {
      if (err) {
        console.error("Room creation error:", err);
        return res.status(500).json({ message: 'Room creation failed' });
      }

      console.log(`Room "${name}" created. ID: ${result.insertId}, Code: ${code}`);
      res.json({ roomId: result.insertId, code });
    }
  );
});

// Join room by code
router.get('/code/:code', (req, res) => {
  const { code } = req.params;
  db.query('SELECT * FROM chat_rooms WHERE code = ?', [code], (err, result) => {
    if (err) {
      console.error("Room lookup error:", err);
      return res.status(500).json({ message: 'Query error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(result[0]);
  });
});

// Delete room by ID and notify via WebSocket
router.delete('/:id', (req, res) => {
  const roomId = req.params.id;

  db.query('DELETE FROM chat_rooms WHERE id = ?', [roomId], (err) => {
    if (err) {
      console.error("Error deleting room:", err);
      return res.status(500).json({ message: 'Delete failed' });
    }

    console.log(`Room ${roomId} deleted.`);

    const wss = req.app.get('wss');
    if (wss) {
      const payload = JSON.stringify({
        type: "room_deleted",
        roomId: parseInt(roomId)
      });

      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(payload);
        }
      });
    }

    res.json({ message: 'Room deleted' });
  });
});

module.exports = router;

// routes/chatroom.routes.js
router.get('/:id', (req, res) => {
  const roomId = req.params.id;
  db.query('SELECT * FROM chat_rooms WHERE id = ?', [roomId], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (result.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json(result[0]);
  });
});

