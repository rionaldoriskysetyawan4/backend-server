// mqtt-handler.js
const mqtt = require('mqtt');
const db   = require('./db');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_URL);
client.on('connect', () => {
  console.log('✔️ Connected to EMQX');
  client.subscribe('sensor/data', { qos: 1 });
});
client.on('message', async (_, payload) => {
  const data = JSON.parse(payload.toString());
  const ts   = data.timestamp ? new Date(data.timestamp) : new Date();
  await db.query(
    'INSERT INTO sensor_data(suhu, kelembaban, timestamp) VALUES($1,$2,$3)',
    [data.suhu, data.kelembaban, ts]
  );
  console.log('✔️ Data saved:', data);
});
