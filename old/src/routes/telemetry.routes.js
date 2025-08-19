const express = require('express');
const router = express.Router();
const pg = require('../db');

router.get('/', async (req, res) => {
    try {
        const { rows } = await pg.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

router.get('/latest', async (req, res) => {
    try {
        const { rows } = await pg.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1');
        if (rows.length === 0) return res.status(404).json({ error: 'No data' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});
router.post('/telemetry', async (req, res) => {
  try {
    const { device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan } = req.body;
    const ts = new Date().toISOString();

    await pg.query(`
      INSERT INTO sensor_data (
        device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, timestamp
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, ts]);

    console.log("💾 Data disimpan:", turbidity);

    // 🚨 Cek kondisi turbidity
    if (turbidity > 100) {
      const message = {
        notification: {
          title: "⚠️ Air Keruh Terdeteksi",
          body: `Turbidity ${turbidity} > 100`
        },
        topic: "alerts"
      };

      await admin.messaging().send(message);
      console.log("📢 Notifikasi terkirim (turbidity > 100)");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/online', async (req, res) => {
    try {
        const { rows } = await pg.query(
            `SELECT timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
        );

        if (rows.length === 0) {
            return res.json({ online: false, message: 'No data received yet' });
        }

        const lastTimestamp = new Date(rows[0].timestamp);
        const now = new Date(); // ✅ Tambahkan ini
        const diffInSeconds = (now - lastTimestamp) / 1000;

        if (diffInSeconds <= 10) {
            res.json({ online: true, lastSeen: lastTimestamp.toISOString() });
        } else {
            res.json({ online: false, lastSeen: lastTimestamp.toISOString() });
        }
    } catch (err) {
        console.error('❌ Error checking online status:', err);
        res.status(500).json({ error: 'Server error' });
    }
});




module.exports = router;

