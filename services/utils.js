const crypto = require('crypto');

function generateRoomCode(length = 6) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, length);
}

module.exports = { generateRoomCode };
