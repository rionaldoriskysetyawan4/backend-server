const Token = require("../models/tokenModel");

// simpan token baru
exports.saveToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: "FCM Token required" });

    await Token.create({ token: fcmToken }); // simpan ke DB
    res.json({ success: true, message: "Token saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save token" });
  }
};

// ambil semua token
exports.getTokens = async (req, res) => {
  try {
    const tokens = await Token.findAll();
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
};
