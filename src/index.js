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
pg.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// 2) Buat tabel (sekali saja)
// Jalankan: node src/index.js --initdb
if (process.argv.includes('--initdb')) {
  const createTable = `
    CREATE TABLE IF NOT EXISTS telemetri (
      id SERIAL PRIMARY KEY,
      temperature DOUBLE PRECISION,
      humidity DOUBLE PRECISION,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  pg.query(createTable)
    .then(() => {
      console.log('✅ Table telemetri siap');
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
  try {
    const data = JSON.parse(payload.toString());
    const { temperature, humidity, timestamp } = data;
    await pg.query(
      'INSERT INTO telemetri (temperature, humidity, timestamp) VALUES ($1, $2, $3)',
      [temperature, humidity, timestamp]
    );
    console.log(`💾 Saved telemetri: ${temperature}°C, ${humidity}%`);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
});

// 4) HTTP API untuk Flutter
app.get('/api/telemetry', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM telemetri ORDER BY timestamp DESC LIMIT 100'
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
