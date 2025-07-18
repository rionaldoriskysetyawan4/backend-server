const express = require('express');
const pg = require('../db');
const router = express.Router();

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

router.get('/online', async (req, res) => {
    try {
        const { rows } = await pg.query(
            `SELECT timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
        );

        if (rows.length === 0) {
            return res.json({ online: false, message: 'No data received yet' });
        }

        const lastTimestamp = new Date(rows[0].timestamp);
        const now = new Date();
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
