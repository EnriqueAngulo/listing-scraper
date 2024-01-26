// Import modules
const { openDb } = require('../db/db');

// Create a new job in the database
async function createJob(title, link, ownerId) {
  const db = await openDb();
  const query = `INSERT OR IGNORE INTO job(title,link,owner_id,start_date) VALUES (?, ?, ?, DATETIME('now'))`;
  const params = [title, link, ownerId];

  try {
    await db.run(query, ...params);
  } catch (error) {
    console.error(error);
  }
}

// Get all jobs from the database
async function getAllJobs() {
  const db = await openDb();

  try {
    const data = await db.all('SELECT * FROM job');
    return data;
  } catch (error) {
    console.error(error);
  }
}

// Get all emails for a job
async function getEmailsForJob(jobId) {
  const db = await openDb();
  const query =
    'SELECT email FROM job_users ju LEFT JOIN user j ON ju.user_id = j.id WHERE job_id = ?';
  const params = [jobId];

  try {
    const data = await db.all(query, ...params);
    return data;
  } catch (error) {
    console.error(error);
  }
}

// Update last_runtime column for a job
async function updateLastRuntime(jobId) {
  const runTime = new Date();
  const db = await openDb();
  const query = `UPDATE job SET last_runtime = DATETIME('now') WHERE id = ?`;
  const params = [jobId];

  try {
    await db.run(query, ...params);
  } catch (error) {
    console.error(error);
  }
}

//get jobs that need to be run
async function getJobsToRun() {
  const db = await openDb();
  const query = `SELECT id, title, link FROM (
    SELECT *,
      CASE
        WHEN CAST((julianday(DATETIME('now')) - julianday(last_runtime)) * 24 * 60 as INTEGER) < interval OR julianday(DATETIME('now')) < julianday(start_date) THEN 0
        ELSE 1
      END as 'to_run'
    FROM job
  )
  WHERE to_run = 1`;
  try {
    const data = await db.all(query);
    return data;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  createJob,
  getAllJobs,
  getEmailsForJob,
  updateLastRuntime,
  getJobsToRun,
};
