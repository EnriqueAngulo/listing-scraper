const sqlite3 = require('sqlite3');
const open = require('sqlite').open;
const dotenv = require('dotenv');
dotenv.config();

let db;

async function openDb() {
  if (!db) {
    db = await open({
      filename: process.env.DB_PATH,
      driver: sqlite3.Database,
    });
  }
  return db;
}

module.exports = {
  openDb,
};
