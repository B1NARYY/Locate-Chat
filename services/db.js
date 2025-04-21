const mysql = require('mysql2');

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

module.exports = db;
