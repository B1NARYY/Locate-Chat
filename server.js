const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 8080; // důležité pro proxy

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

app.set('db', db);

// === Import routes ===
const chatroomRoutes = require('./routes/chatroom.routes');
const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');

// === Spuštění HTTP serveru ===
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// === WebSocket server ===
const wss = new WebSocket.Server({ server });
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

// === Message routes (předáváme instanci wss) ===
const messageRoutes = require('./routes/message.routes')(wss);

// === API routes ===
app.use('/api/chatrooms', chatroomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api', authRoutes);

// === Static files ===
app.use(express.static(path.join(__dirname, 'public')));

// === Fallback – redirect vše mimo /api na frontend (např. pro index.html) ===
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
