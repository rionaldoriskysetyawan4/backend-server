const Token = require("../models/tokenModel");
const admin = require("../config/firebase");
const pool = require("../db");

async function saveSensorData(req, res) {
  const { device_id, turbidity, ph, watertemp, humidity, waterlevel } = req.body;
  const ts = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO sensor_data (device_id, turbidity, ph, watertemp, humidity, waterlevel, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [device_id, turbidity, ph, watertemp, humidity, waterlevel, ts]
    );

    if (turbidity >= 120) {
      const tokens = await Token.getAllTokens();
      if (tokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          notification: {
            title: "⚠️ Air Kotor",
            body: `Turbidity tinggi: ${turbidity}`,
          },
          tokens,
        });
        console.log("✅ Push notif terkirim: turbidity >= 120");
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB or FCM error" });
  }
}

module.exports = { saveSensorData };
