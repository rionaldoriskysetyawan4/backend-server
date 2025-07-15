const express = require('express');
const pg = require('../db');
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pg.query('SELECT * FROM food_data WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Data not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { food_id, food, timestamp } = req.body;
        const id = req.params.id;

        const { rows } = await pg.query(`
      UPDATE food_data SET food_id = $1, food = $2, timestamp = $3 WHERE id = $4 RETURNING *
    `, [food_id, food, timestamp, id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Data not found' });
        res.json({ success: true, data: rows[0] });

    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
