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

        // 1. Ambil data sebelumnya
        const { rows: oldRows } = await pg.query('SELECT * FROM hour_data WHERE id = $1', [id]);
        if (oldRows.length === 0) return res.status(404).json({ error: 'Data not found' });

        const oldData = oldRows[0];

        // 2. Cek apakah hour, minute, atau isactive berubah
        const isChanged =
            oldData.hour !== hour ||
            oldData.minute !== minute ||
            oldData.isactive !== isactive;

        // 3. Update DB
        const { rows } = await pg.query(`
            UPDATE hour_data 
            SET time_id = $1, hour = $2, minute = $3, timestamp = $4, isactive = $5
            WHERE id = $6 RETURNING *
        `, [time_id, hour, minute, timestamp, isactive, id]);

        const updatedData = rows[0];

        // 4. Publish MQTT jika ada perubahan
        if (isChanged) {
            const topic = 'sensors/hour/update';
            const message = `${updatedData.time_id},${updatedData.hour},${updatedData.minute},${updatedData.isactive}`;

            mqttClient.publish(topic, message, { qos: 1 }, (err) => {
                if (err) {
                    console.error(`❌ Failed to publish to topic ${topic}:`, err);
                    return res.status(500).json({ error: 'Failed to publish update' });
                }
                console.log(`✅ Published hour update to topic ${topic}`);
                res.json({ success: true, data: updatedData, published: true });
            });
        } else {
            // Tidak ada perubahan signifikan → tidak publish
            console.log(`ℹ️ Tidak ada perubahan pada hour, minute, atau isactive. Tidak publish MQTT.`);
            res.json({ success: true, data: updatedData, published: false });
        }

    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
