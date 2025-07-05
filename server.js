const express = require('express');
const app = express();
require('dotenv').config();
const telemetryRoutes = require('./routes/telemetry');
const db = require('./db'); // koneksi pg
const mqtt = require('mqtt');

// Middleware untuk parsing JSON
app.use(express.json());

// Routing untuk /api/telemetry
app.use('/api/telemetry', telemetryRoutes);

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ===========================
// MQTT SETUP
// ===========================

const mqttUrl = process.env.MQTT_URL; // dari .env, contoh: mqtt://user:pass@broker:1883
const mqttClient = mqtt.connect(mqttUrl);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  const topic = 'sensor/data';

  mqttClient.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to topic: ${topic}`);
    } else {
      console.error('❌ Failed to subscribe:', err.message);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  console.log(`📥 Message received on ${topic}: ${message.toString()}`);

  try {
    const { temperature, humidity, timestamp } = JSON.parse(message.toString());

    const query = `
      INSERT INTO telemetry (temperature, humidity, timestamp)
      VALUES ($1, $2, $3)
    `;
    await db.query(query, [temperature, humidity, timestamp]);

    console.log('✅ Data inserted to database');
  } catch (err) {
    console.error('❌ Failed to process MQTT message:', err.message);
  }
});
