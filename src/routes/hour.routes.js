const express = require('express');
const pg = require('../db');
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

        // implementasi publish data hour update
        res.json({ success: true, data: rows[0] });

    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
