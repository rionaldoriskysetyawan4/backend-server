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


module.exports = router;
