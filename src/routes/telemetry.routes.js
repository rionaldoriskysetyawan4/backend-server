const express = require('express');
const router = express.Router();
const pg = require('../db');


// Route: /latest
router.get('/latest', async (req, res) => {
    try {
        const { rows } = await pg.query(
            'SELECT timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
        );
        if (rows.length === 0) return res.json({ online: false });

        const lastTimestamp = new Date(rows[0].timestamp);
        const now = new Date();
        const diff = (now - lastTimestamp) / 1000; // in seconds

        res.json({ online: diff < 10 }); // online jika < 10 detik
    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Route: /online
router.get('/online', (req, res) => {
});

// Export router dan fungsi update
module.exports = router;
