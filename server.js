const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL connection
const db = mysql.createConnection({
  host: 'sql.daniellinda.net',
  user: 'remote',
  password: 'hm3C4iLL+',
  database: 'chatdb',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// Simple in-memory user tracking for WebSocket
const users = new Map();

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  ws.on('message', (message) => {
    // Can be extended
    console.log('WS message:', message);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });
});

// === API ===

// Authenticated user extraction (dummy check)
function extractUsername(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (token === 'dummy') {
    return req.body.sender_username || req.query.username || null;
  }
  return null;
}

// Register
app.post('/api/register', (req, res) => {
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

// Login
app.post('/api/login', (req, res) => {
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

// Get user ID by username
app.get('/api/users/by-username/:username', (req, res) => {
  db.query('SELECT id FROM users WHERE username = ?', [req.params.username], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (result.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result[0]);
  });
});

// Create chatroom
app.post('/api/chatrooms', (req, res) => {
  const { name, owner_id } = req.body;
  db.query('INSERT INTO chat_rooms (name, owner_id) VALUES (?, ?)', [name, owner_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Room creation failed' });
    res.json({ roomId: result.insertId });
  });
});

// Get all chatrooms
app.get('/api/chatrooms', (req, res) => {
  db.query('SELECT * FROM chat_rooms', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error loading rooms' });
    res.json(results);
  });
});

// Send message
app.post('/api/messages', (req, res) => {
  const { chat_room_id, sender_username, content, latitude, longitude } = req.body;

  db.query('SELECT id FROM users WHERE username = ?', [sender_username], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'Invalid user' });

    const sender_id = results[0].id;

    db.query(
      'INSERT INTO messages (chat_room_id, sender_id, content, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [chat_room_id, sender_id, content, latitude, longitude],
      (err) => {
        if (err) return res.status(500).json({ message: 'Message failed' });
        res.json({ message: 'Message sent' });
      }
    );
  });
});

// Get all messages for room
app.get('/api/messages/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  db.query(
    'SELECT sender_id, content, passed_filter, created_at, latitude, longitude FROM messages WHERE chat_room_id = ?',
    [roomId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Query failed' });
      res.json(results);
    }
  );
});

// Save location (separátně, pro budoucí použití – nepoužívá se teď)
app.post('/api/locations', (req, res) => {
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

// Get latest locations for room
app.get('/api/locations/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const sql = `SELECT user_id, latitude, longitude FROM locations WHERE chat_room_id = ? ORDER BY created_at DESC`;

  db.query(sql, [roomId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Location load failed' });

    const latest = {};
    results.forEach(row => {
      if (!latest[row.user_id]) latest[row.user_id] = row;
    });

    res.json(Object.values(latest));
  });
});
