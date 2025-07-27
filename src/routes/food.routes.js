const express = require('express');
const pg      = require('../db');
const router  = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM food_data WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Data not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const food = parseInt(req.body.food, 10);

    if (isNaN(id) || isNaN(food)) {
      return res.status(400).json({ error: 'invalid id or food' });
    }

    // UPDATE hanya kolom food; food_id ditetapkan sama dengan id; timestamp di‐set NOW()
    const { rows } = await pg.query(`
      UPDATE food_data
         SET food      = $1,
             food_id   = $2,
             timestamp = NOW()
       WHERE id = $3
    `, [food, id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
