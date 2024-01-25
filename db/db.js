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

//exportable function to insert data
async function insertItem(title, price, link, dateRetrieved) {
  try {
    const db = await openDb();

    await db.run(
      'INSERT OR IGNORE INTO job_items(title,price,link,dateRetrieved) VALUES (?, ?, ?, ?)',
      title,
      price,
      link,
      dateRetrieved
    );
  } catch (error) {
    console.error(error);
  }
}
//function to grab all rows where emailSent is 0. Return rows as an array of objects
async function getNewItems() {
  const db = await openDb();

  let data = await db.all('SELECT * FROM job_items WHERE emailSent = 0');

  return data;
}

async function setEmailSent(link) {
  const db = await openDb();
  await db.run('UPDATE job_items SET emailSent = 1 WHERE link = ?', link);
}

module.exports = {
  insertItem,
  getNewItems,
  setEmailSent,
};
