const pool = require("../config/db");

const Token = {
  // simpan token baru (user_id optional)
  async saveToken(user_id, token) {
    return pool.query(
      `INSERT INTO fcm_tokens (user_id, token)
       VALUES ($1, $2)
       ON CONFLICT (token) DO NOTHING`,
      [user_id || null, token]
    );
  },

  // ambil semua token FCM
  async getAllTokens() {
    const res = await pool.query("SELECT token FROM fcm_tokens");
    return res.rows.map(r => r.token);
  },
};

module.exports = Token;
