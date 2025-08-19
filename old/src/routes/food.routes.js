const express = require('express');
const pg = require('../db');
const mqttClient = require('../mqtt'); // ✅ pakai instance aktif dari mqtt.js
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pg.query('SELECT * FROM food_data WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Data not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { food_id, food } = req.body;
        const id = req.params.id;

        // Ambil data lama
        const { rows: oldRows } = await pg.query('SELECT * FROM food_data WHERE id = $1', [id]);
        if (oldRows.length === 0) return res.status(404).json({ error: 'Data not found' });

        const oldData = oldRows[0];

        // Cek apakah data berubah
        const isChanged = oldData.food !== food;

        // Update DB
        const { rows } = await pg.query(`
            UPDATE food_data SET food_id = $1, food = $2
            WHERE id = $3 RETURNING *
        `, [food_id, food, id]);

        const updatedData = rows[0];

        // Publish jika berubah
        if (isChanged) {
            const topic = 'sensors/food/update';
            const message = `${updatedData.food_id},${updatedData.food}`;

            mqttClient.publish(topic, message, { qos: 1 }, (err) => {
                if (err) {
                    console.error('❌ MQTT publish error:', err);
                    return res.status(500).json({ error: 'Failed to publish' });
                }
                console.log('✅ MQTT publish success:', message);
                res.json({ success: true, data: updatedData, published: true });
            });
        } else {
            res.json({ success: true, data: updatedData, published: false });
        }

    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
