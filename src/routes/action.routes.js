const express = require('express');
const pg = require('../db');
const router = express.Router();

async function getLatestWaterlevel(pgInstance = pg) {
  try {
    const { rows } = await pgInstance.query(
      `SELECT waterlevel FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
    );

    if (!rows || rows.length === 0) return null;
    return rows[0].waterlevel;
  } catch (err) {
    console.error('[getLatestWaterlevel] DB error:', err.message || err);
    throw err;
  }
}

module.exports = { getLatestWaterlevel, router };
