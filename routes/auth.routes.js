const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../services/db');
const saltRounds = 10;

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return res.status(500).json({ message: 'Hash error' });

    db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], (err) => {
      if (err) return res.status(500).json({ message: 'Registration failed' });
      res.json({ message: 'User registered' });
    });
  });
});

router.post('/login', (req, res) => {
  const { username, password_hash } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'Login failed' });

    bcrypt.compare(password_hash, results[0].password_hash, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      res.json({
        message: 'Login successful',
        token: 'dummy',
        username: results[0].username,
        user_id: results[0].id
      });
    });
  });
});

// 🔧 Missing route – now added:
router.get('/users/by-username/:username', (req, res) => {
  const { username } = req.params;

  db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(results[0]);
  });
});

module.exports = router;
