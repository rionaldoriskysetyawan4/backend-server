const pg = require('../db');

// Add token
async function addToken(token) {
  const query = 'INSERT INTO tokens (token) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *';
  const values = [token];
  const res = await pg.query(query, values);
  return res.rows[0]; // data token yang baru
}

// Get all tokens
async function getAllTokens() {
  const res = await pg.query('SELECT * FROM tokens');
  return res.rows;
}

// Delete token
async function deleteToken(token) {
  const query = 'DELETE FROM tokens WHERE token = $1';
  const values = [token];
  await pg.query(query, values);
}

module.exports = {
  addToken,
  getAllTokens,
  deleteToken
};
