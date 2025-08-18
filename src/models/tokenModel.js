const pool = require("../config/db");

const Token = {
  async saveToken(user_id, token) {
    return pool.query(
      `INSERT INTO fcm_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING`,
      [user_id || null, token]
    );
  },

  async getAllTokens() {
    const res = await pool.query("SELECT token FROM fcm_tokens");
    return res.rows.map(r => r.token);
  },

  // hapus token list
  async removeTokens(tokens) {
    if (!tokens || tokens.length === 0) return;
    const params = tokens.map((_, i) => `$${i + 1}`).join(",");
    return pool.query(`DELETE FROM fcm_tokens WHERE token IN (${params})`, tokens);
  }
};

module.exports = Token;
