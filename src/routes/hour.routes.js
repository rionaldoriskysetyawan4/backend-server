const express = require('express');
const pg = require('../db');
const mqttClient = require('../mqtt'); // ✅ Pakai instance, bukan { MqttClient }
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pg.query('SELECT * FROM hour_data WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Data not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { time_id, hour, minute, timestamp, isactive } = req.body;
        const id = req.params.id;

        const { rows } = await pg.query(`
            UPDATE hour_data SET time_id = $1, hour = $2, minute = $3, timestamp = $4, isactive = $5
            WHERE id = $6 RETURNING *
        `, [time_id, hour, minute, timestamp, isactive, id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Data not found' });

        const updatedData = rows[0];

        const topic = 'sensors/hour/update';
        const message = `${updatedData.time_id},${updatedData.hour},${updatedData.minute},${updatedData.isactive}`;


        mqttClient.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                console.error(`❌ Failed to publish to topic ${topic}:`, err);
                return res.status(500).json({ error: 'Failed to publish update' });
            }
            console.log(`✅ Published hour update to topic ${topic}`);
            res.json({ success: true, data: updatedData }); // Pindah ke sini agar hanya kirim response saat publish berhasil
        });

    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
