require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const { Client: PgClient } = require('pg');
const mqtt = require('mqtt');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
app.use(express.json());

let latestPumpData = null;

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

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
    const createHourTable = `
      CREATE TABLE IF NOT EXISTS hour_data (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        hour1 DOUBLE PRECISION,
        hour2 DOUBLE PRECISION,
        hour3 DOUBLE PRECISION,
        hour4 DOUBLE PRECISION,
        hour5 DOUBLE PRECISION,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    const createMinuteTable = `
      CREATE TABLE IF NOT EXISTS minute_data (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        minute1 DOUBLE PRECISION,
        minute2 DOUBLE PRECISION,
        minute3 DOUBLE PRECISION,
        minute4 DOUBLE PRECISION,
        minute5 DOUBLE PRECISION,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    try {
      await pg.query(createTelemetryTable);
      await pg.query(createHourTable);
      await pg.query(createMinuteTable);
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

  const topics = ['sensors/telemetry', 'sensors/pump', 'sensors/hour', 'sensors/minute'];
  topics.forEach(topic => {
    client.subscribe(topic, { qos: 1 }, err => {
      if (err) console.error(`❌ Subscribe error for ${topic}:`, err);
      else console.log(`🔔 Subscribed to ${topic}`);
    });

  });

});

// Move message handler outside of `connect`
client.on('message', async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());

    if (topic === 'sensors/telemetry') {
      const {
        device_id, templand, watertemp, ph, turbidity, humidity, timestamp
      } = data;

      const ts = timestamp || new Date().toISOString();
      await pg.query(
        `INSERT INTO sensor_data (
          device_id, templand, watertemp, ph, turbidity, humidity, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [device_id, templand, watertemp, ph, turbidity, humidity, ts]
      );
      console.log('💾 Saved telemetry data');
    }

    else if (topic === 'sensors/pump') {
      latestPumpData = data; // ✅ simpan data terbaru
      io.emit('pumpData', data); // 👉 kirim ke WebSocket
      console.log('📡 Pump data sent via WebSocket:', data);
    }


    else if (topic === 'sensors/hour') {
      const { device_id, hour1, hour2, hour3, hour4, hour5 } = data;

      await pg.query(
        `INSERT INTO hour_data (
          device_id, hour1, hour2, hour3, hour4, hour5, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [device_id, hour1, hour2, hour3, hour4, hour5]
      );
      console.log('💾 Saved hour schedule data');
    }

    else if (topic === 'sensors/minute') {
      const { device_id, minute1, minute2, minute3, minute4, minute5 } = data;

      await pg.query(
        `INSERT INTO minute_data (
          device_id, minute1, minute2, minute3, minute4, minute5, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [device_id, minute1, minute2, minute3, minute4, minute5]
      );
      console.log('💾 Saved hour schedule data');
    }

  } catch (err) {
    console.error('❌ Error processing MQTT message:', err.message);
  }
});

app.get('/api/hour', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM hour_data ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error saat GET /api/hour:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/hour', async (req, res) => {
  try {
    const { device_id, hour1, hour2, hour3, hour4, hour5, timestamp } = req.body;

    if (!device_id || !timestamp) {
      return res.status(400).json({ error: 'Missing device_id or timestamp' });
    }

    const payload = JSON.stringify({ device_id, hour1, hour2, hour3, hour4, hour5, timestamp });

    client.publish('sensors/hour', payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Gagal publish hour ke MQTT:', err);
        return res.status(500).json({ error: 'MQTT publish error' });
      }

      console.log('📤 Data hour dikirim ke ESP32:', payload);
      res.json({ success: true, message: 'Data hour berhasil dikirim ke ESP32' });
    });

  } catch (err) {
    console.error('❌ Error saat POST /api/hour:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/minute', async (req, res) => {
  try {
    const { rows } = await pg.query(
      'SELECT * FROM minute_data ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error saat GET /api/minute:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/minute', async (req, res) => {
  try {
    const { device_id, minute1, minute2, minute3, minute4, minute5, timestamp } = req.body;

    if (!device_id || !timestamp) {
      return res.status(400).json({ error: 'Missing device_id or timestamp' });
    }

    const payload = JSON.stringify({ device_id, minute1, minute2, minute3, minute4, minute5, timestamp });

    client.publish('sensors/minute', payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Gagal publish minute ke MQTT:', err);
        return res.status(500).json({ error: 'MQTT publish error' });
      }

      console.log('📤 Data minute dikirim ke ESP32:', payload);
      res.json({ success: true, message: 'Data minute berhasil dikirim ke ESP32' });
    });

  } catch (err) {
    console.error('❌ Error saat POST /api/minute:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/pump', (req, res) => {
  if (latestPumpData) {
    res.json(latestPumpData);
  } else {
    res.status(404).json({ error: 'No pump data available' });
  }
});

app.post('/api/pump', async (req, res) => {
  try {
    const { device_id, pump1, pump2, timestamp } = req.body;

    // Validasi sederhana
    if (!device_id || pump1 == null || pump2 == null || !timestamp) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Publish ke MQTT
    const payload = JSON.stringify({ device_id, pump1, pump2, timestamp });
    client.publish('sensors/pump', payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Gagal publish ke MQTT:', err);
        return res.status(500).json({ error: 'MQTT publish error' });
      }

      console.log('📤 Data pump dikirim ke ESP32:', payload);
      res.json({ success: true, message: 'Data pump berhasil dikirim ke ESP32' });
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Server error' });
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