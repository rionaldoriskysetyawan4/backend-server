const Token = require("../models/tokenModel");
const admin = require("../config/firebase");

async function registerToken(req, res) {
  const { user_id, token, subscribeToTopic } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });

  try {
    await Token.saveToken(user_id, token);

    // Optional: subscribe token to topic "turbidity_alert" supaya server bisa broadcast via topic
    if (subscribeToTopic) {
      try {
        await admin.messaging().subscribeToTopic([token], "turbidity_alert");
      } catch (err) {
        console.warn("subscribeToTopic error:", err.message);
      }
    }

    res.json({ success: true, message: "Token registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerToken };
