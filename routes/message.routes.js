const express = require('express');
const db = require('../services/db');

module.exports = (wss) => {
  const router = express.Router();

  // Odeslání zprávy
  router.post('/', (req, res) => {
    const { chat_room_id, sender_username, content, latitude, longitude } = req.body;

    if (!chat_room_id || !sender_username || !content) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Získat ID uživatele podle username
    db.query('SELECT id FROM users WHERE username = ?', [sender_username], (err, userRes) => {
      if (err || userRes.length === 0) {
        return res.status(400).json({ message: 'Invalid user' });
      }

      const sender_id = userRes[0].id;

      // Uložit zprávu
      db.query(
        'INSERT INTO messages (chat_room_id, sender_id, content, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
        [chat_room_id, sender_id, content, latitude, longitude],
        (err, result) => {
          if (err) {
            console.error("Message insert error:", err);
            return res.status(500).json({ message: 'Message failed' });
          }

          const messageId = result.insertId;

          // Načíst zprávu včetně sender_username
          db.query(
            `SELECT messages.*, users.username AS sender_username
             FROM messages
             JOIN users ON messages.sender_id = users.id
             WHERE messages.id = ?`,
            [messageId],
            (err, rows) => {
              if (err || rows.length === 0) {
                return res.status(500).json({ message: 'Fetch failed' });
              }

              const fullMessage = rows[0];

              // Poslat přes WebSocket všem
              wss.clients.forEach(client => {
                if (client.readyState === 1) {
                  client.send(JSON.stringify(fullMessage));
                }
              });

              res.json({ message: 'Message sent' });
            }
          );
        }
      );
    });
  });

  // Načíst zprávy pro místnost
  router.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;

    db.query(
      `SELECT messages.*, users.username AS sender_username
       FROM messages
       JOIN users ON messages.sender_id = users.id
       WHERE messages.chat_room_id = ?
       ORDER BY messages.created_at ASC`,
      [roomId],
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Query failed' });
        res.json(results);
      }
    );
  });

  return router;
};
