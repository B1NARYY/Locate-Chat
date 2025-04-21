const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === MySQL připojení ===
const db = mysql.createConnection({
  host: 'sql.daniellinda.net',
  user: 'remote',
  password: 'hm3C4iLL+',
  database: 'chatdb',
  port: 3306
});

db.connect(err => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to MySQL');
});

// === Zpřístupnění připojení v celé aplikaci ===
app.set('db', db);

// === Import routes ===
const chatroomRoutes = require('./routes/chatroom.routes');
const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');

// === Server ===
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// === WebSocket ===
const wss = new WebSocket.Server({ server });

// Zde je správně až po vytvoření wss:
app.set('wss', wss);

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  ws.on('message', (message) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });
});

// === Message routes musí být volána jako funkce s wss ===
const messageRoutes = require('./routes/message.routes')(wss);

// === API routes ===
app.use('/api/chatrooms', chatroomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api', authRoutes); // login, register, etc.

// === Static files – až po API routách ===
app.use(express.static(path.join(__dirname, 'public')));

// === Fallback pro neexistující API ===
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// === Export WebSocket instance (volitelně) ===
module.exports = { app, server, wss };
