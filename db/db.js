const sqlite3 = require('sqlite3');
const open = require('sqlite').open;
const dotenv = require('dotenv');
dotenv.config();

async function openDb() {
  return open({
    filename: process.env.DB_PATH,
    driver: sqlite3.Database,
  });
}

module.exports = {
  openDb,
};
