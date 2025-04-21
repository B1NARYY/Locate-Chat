const WebSocket = require('ws');

let wss;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket connected');
    ws.on('message', (message) => {
      console.log('WS message received:', message);
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
}

function broadcastToAll(message) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { setupWebSocket, broadcastToAll };
