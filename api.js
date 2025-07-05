// api.js
const express = require('express');
const db      = require('./db');
require('dotenv').config();
const app = express();
app.get('/api/sensor', async (_, res) => {
  const { rows } = await db.query(
    'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100'
  );
  res.json(rows);
});
app.listen(process.env.PORT, () =>
  console.log(`🚀 API on port ${process.env.PORT}`)
);
