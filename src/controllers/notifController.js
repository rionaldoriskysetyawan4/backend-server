
const admin = require("../config/firebase");
const Token = require("../models/tokenModel");

async function sendToAll(req, res) {
  const { title, body } = req.body;
  try {
    const tokens = await Token.getAllTokens();
    if (tokens.length === 0) return res.json({ message: "No tokens found" });

    const message = { notification: { title, body }, tokens };
    const response = await admin.messaging().sendEachForMulticast(message);

    res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { sendToAll };
