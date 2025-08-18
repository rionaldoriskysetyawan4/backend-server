
const Token = require("../models/tokenModel");

async function registerToken(req, res) {
  const { user_id, token } = req.body;
  try {
    await Token.saveToken(user_id, token);
    res.json({ success: true, message: "Token registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerToken };
