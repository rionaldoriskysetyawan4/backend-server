require('dotenv').config();
const express = require('express');
const { Client: PgClient } = require('pg');
const mqtt = require('mqtt');

const app = express();
app.use(express.json());

// 1) Setup PostgreSQL
const pg = new PgClient({
  host: process.env.PGHOST,
  port: +process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});
//
pg.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// 2) Buat tabel jika belum ada
if (process.argv.includes('--initdb')) {
  const createTable = `
    CREATE TABLE IF NOT EXISTS sensor_data (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      temperature DOUBLE PRECISION,
      humidity DOUBLE PRECISION,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  ////
  pg.query(createTable)
    .then(() => {
      console.log('✅ Table sensor_data siap');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// 3) Setup MQTT client
const mqttUrl = `mqtt://${process.env.EMQX_HOST}:${process.env.EMQX_PORT}`;
const mqttOptions = {
  username: process.env.EMQX_USERNAME,
  password: process.env.EMQX_PASSWORD,
};
const client = mqtt.connect(mqttUrl, mqttOptions);

client.on('connect', () => {
  console.log('✅ Connected to EMQX MQTT');
  client.subscribe('sensors/telemetry', { qos: 1 }, err => {
    if (err) console.error('❌ Subscribe error:', err);
    else console.log('🔔 Subscribed to sensors/telemetry');
  });
});

client.on('message', async (topic, payload) => {
  console.log('📥 Received message from MQTT:', payload.toString());
  try {
    const data = JSON.parse(payload.toString());
    console.log('📦 Parsed data:', data);

    const { device_id, temperature, humidity, timestamp } = data;

    // Fallback timestamp jika tidak tersedia
    const ts = timestamp || new Date().toISOString();

    await pg.query(
      'INSERT INTO sensor_data (device_id, temperature, humidity, timestamp) VALUES ($1, $2, $3, $4)',
      [device_id, temperature, humidity, ts]
    );
    console.log(`💾 Saved telemetry: ${temperature}°C, ${humidity}%`);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
});

// 4) HTTP API untuk Flutter
app.get('/api/telemetry', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// 5) Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
