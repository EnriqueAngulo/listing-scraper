// Import modules
const { openDb } = require('../db/db');

// Get all users from the database
async function getAllUsers() {
  const db = await openDb();

  try {
    const data = await db.all('SELECT * FROM user');
    return data;
  } catch (error) {
    console.error('Error getting all users:', error);
  }
}

// Create a new user in the database
async function createUser(email, name) {
  const db = await openDb();
  const query = 'INSERT OR IGNORE INTO user(email,name) VALUES (?, ?)';
  const params = [email, name];

  try {
    await db.run(query, ...params);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

module.exports = {
  getAllUsers,
  createUser,
};
