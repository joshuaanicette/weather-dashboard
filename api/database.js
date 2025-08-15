const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SAVED_CITIES_FILE = path.join(__dirname, 'saved_cities.db');

const initDb = () => {
  const db = new sqlite3.Database(SAVED_CITIES_FILE, (err) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }
    db.run(`CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )`);
  });
  db.close();
};

module.exports = { initDb };