const express = require('express');
const pg = require('../db');
const mqttClient = require('../mqtt'); // ✅ pakai instance aktif dari mqtt.js
const router = express.Router();

async function getLatestWaterlevel(pgInstance = defaultPg) {
  try {
    const { rows } = await pgInstance.query(
      `SELECT waterlevel FROM sensor_data ORDER BY timestamp DESC LIMIT 1`
    );

    if (!rows || rows.length === 0) return null; // tidak ada data
    return rows[0].waterlevel; // kembalikan value saja
  } catch (err) {
    // biarkan caller yang menangani error, tapi log singkat juga berguna
    console.error('[getLatestWaterlevel] DB error:', err.message || err);
    throw err; // lempar supaya caller tahu ada error
  }
}

module.exports = { getLatestWaterlevel };