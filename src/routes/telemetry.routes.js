const express = require('express');
const router = express.Router();

// Route: /latest
router.get('/latest', async (req, res) => {
    try {
        const { rows } = await pg.query(
            'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('❌ DB error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Route: /online
router.get('/online', (req, res) => {
});

// Export router dan fungsi update
// module.exports = {
//     router,
// };
