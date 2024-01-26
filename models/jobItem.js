// Import modules
const { openDb } = require('../db/db');

// Insert a new job item into the database
async function insertItem(jobId, title, price, link) {
  const db = await openDb();
  const query = `INSERT OR IGNORE INTO job_items(job_id,title,price,link,dateRetrieved) VALUES (?,?, ?, ?, DATETIME('now'))`;
  const params = [jobId, title, price, link];

  try {
    await db.run(query, ...params);
  } catch (error) {
    console.error('Error inserting item:', error);
  }
}

// Get all rows for job where emailSent is 0. Return rows as an array of objects
async function getNewItems(jobId) {
  const db = await openDb();
  const query = 'SELECT * FROM job_items WHERE emailSent = 0 and job_id = ?';
  const params = [jobId];

  try {
    const data = await db.all(query, ...params);
    return data;
  } catch (error) {
    console.error('Error getting new items:', error);
  }
}

// Set emailSent to 1 for a specific job item
async function setEmailSent(id) {
  const db = await openDb();
  const query = 'UPDATE job_items SET emailSent = 1 WHERE id = ?';
  const params = [id];

  try {
    await db.run(query, ...params);
  } catch (error) {
    console.error('Error setting email sent:', error);
  }
}

module.exports = {
  insertItem,
  getNewItems,
  setEmailSent,
};
