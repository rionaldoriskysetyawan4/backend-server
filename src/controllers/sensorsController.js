const Token = require("../models/tokenModel");
const admin = require("../config/firebase");
const pool = require("../config/db");

async function saveSensorData(req, res) {
  const { device_id, turbidity, ph, watertemp, humidity, waterlevel } = req.body;
  const ts = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO sensor_data (device_id, turbidity, ph, watertemp, humidity, waterlevel, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [device_id, turbidity, ph, watertemp, humidity, waterlevel, ts]
    );

    if (typeof turbidity === "number" && turbidity >= 120) {
      // Option A: kirim ke semua token yang tersimpan (multicast)
      const tokens = await Token.getAllTokens();
      if (tokens.length > 0) {
        // FCM multicast batas 500 token per call
        const chunks = [];
        for (let i = 0; i < tokens.length; i += 500) {
          chunks.push(tokens.slice(i, i + 500));
        }

        for (const chunk of chunks) {
          const message = {
            notification: { title: "⚠️ Air Kotor", body: `Turbidity tinggi: ${turbidity}` },
            tokens: chunk,
          };

          const response = await admin.messaging().sendEachForMulticast(message);

          // cleanup invalid tokens
          const tokensToRemove = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const err = resp.error;
              if (err && (err.code === "messaging/registration-token-not-registered" || err.code === "messaging/invalid-registration-token")) {
                tokensToRemove.push(chunk[idx]);
              }
            }
          });
          if (tokensToRemove.length > 0) {
            await Token.removeTokens(tokensToRemove);
            console.log("Removed invalid tokens:", tokensToRemove.length);
          }
        }
        console.log("Notif sent for turbidity >= 120");
      }

      // Option B (alternatif): kirim via topic (jika kamu subscribe client ke topic)
      // await admin.messaging().send({
      //   topic: "turbidity_alert",
      //   notification: { title: "⚠️ Air Kotor", body: `Turbidity tinggi: ${turbidity}` }
      // });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("sensor save error:", err);
    res.status(500).json({ error: "DB or FCM error" });
  }
}

module.exports = { saveSensorData };
