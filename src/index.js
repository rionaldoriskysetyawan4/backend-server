require('dotenv').config();
const express = require('express');
const { Client: PgClient } = require('pg');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(express.json());

// ✅ Middleware CORS agar Flutter bisa akses
app.use(cors({
  origin: '*', // bisa ganti ke domain frontend kamu
  methods: ['GET', 'POST', 'DELETE'],
}));

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

// 2) Buat tabel jika belum ada
if (process.argv.includes('--initdb')) {
  (async () => {
    const createTelemetryTable = `
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        templand DOUBLE PRECISION,
        watertemp DOUBLE PRECISION,
        ph DOUBLE PRECISION,
        turbidity DOUBLE PRECISION,
        humidity DOUBLE PRECISION,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    const createPumpTable = `
      CREATE TABLE IF NOT EXISTS sensor_pump (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        pump1 TEXT,
        pump2 TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    try {
      await pg.query(createTelemetryTable);
      await pg.query(createPumpTable);
      console.log('✅ Kedua tabel berhasil dibuat');
      process.exit(0);
    } catch (err) {
      console.error('❌ Gagal membuat tabel:', err);
      process.exit(1);
    }
  })();
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

    const { device_id, templand, watertemp, ph, turbidity, humidity, timestamp } = data;
    const ts = timestamp || new Date().toISOString();

    await pg.query(
      'INSERT INTO sensor_data (device_id, templand, watertemp, ph, turbidity, humidity, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [device_id, templand, watertemp, ph, turbidity, humidity, ts]
    );
    console.log(`💾 Saved telemetry: ${templand}°C, ${watertemp}°C,${ph}°C,${turbidity}°C,${humidity}°C, ${humidity}%`);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
});


app.get('/api/pump', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM sensor_pump ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/pump', async (req, res) => {
  try {
    const { device_id, pump1, pump2 } = req.body;

    await pg.query(
      'INSERT INTO sensor_pump (device_id, pump1, pump2, timestamp) VALUES ($1, $2, $3, NOW())',
      [device_id, pump1, pump2]
    );

    res.json({ success: true, message: 'Data pump berhasil disimpan' });
  } catch (err) {
    console.error('❌ Error menyimpan data pump:', err);
    res.status(500).json({ error: 'DB error' });
  }
});



// 4) API: Get 100 terakhir
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

// 4.5) API: Get data terbaru
app.get('/api/telemetry/latest', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1'
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'No data' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});



// 5) Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});





// // 6) API: Delete semua data
// app.delete('/api/telemetry', async (req, res) => {
//   console.log('📡 DELETE /api/telemetry dipanggil');
//   try {
//     const result = await pg.query('DELETE FROM sensor_data');
//     res.json({ success: true, message: 'Semua data berhasil dihapus' });
//   } catch (err) {
//     console.error('❌ Error saat menghapus semua data:', err);
//     res.status(500).json({ error: 'Gagal menghapus semua data' });
//   }
// });