const Token = require("../models/tokenModel");
const admin = require("../config/firebase");

async function sendToAll(req, res) {
  const { title, body } = req.body;
  try {
    const tokens = await Token.getAllTokens();
    if (tokens.length === 0) return res.json({ message: "No tokens found" });

    // chunk 500
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens: chunk,
      });

      // cleanup invalids like earlier...
      const toRemove = [];
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const err = r.error;
          if (err && (err.code === "messaging/registration-token-not-registered" || err.code === "messaging/invalid-registration-token")) {
            toRemove.push(chunk[idx]);
          }
        }
      });
      if (toRemove.length) await Token.removeTokens(toRemove);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { sendToAll };
