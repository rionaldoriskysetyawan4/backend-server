const mqtt = require('mqtt');
const pg = require('./db');

const mqttUrl = `mqtt://${process.env.EMQX_HOST}:${process.env.EMQX_PORT}`;
const mqttOptions = {
  username: process.env.EMQX_USERNAME,
  password: process.env.EMQX_PASSWORD,
};
const client = mqtt.connect(mqttUrl, mqttOptions);

client.on('connect', () => {
  console.log('✅ Connected to EMQX MQTT');
  const topics = ['sensors/telemetry', 'sensors/hour', 'sensors/food'];
  topics.forEach(topic => {
    client.subscribe(topic, { qos: 1 }, err => {
      if (err) console.error(`❌ Subscribe error for ${topic}:`, err);
      else console.log(`🔔 Subscribed to ${topic}`);
    });
  });
});

client.on('message', async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());

    if (topic === 'sensors/telemetry') {
      const { device_id, templand, watertemp, ph, turbidity, humidity, timestamp } = data;
      const ts = timestamp || new Date().toISOString();

      await pg.query(`
        INSERT INTO sensor_data (device_id, templand, watertemp, ph, turbidity, humidity, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [device_id, templand, watertemp, ph, turbidity, humidity, ts]);

    } else if (topic === 'sensors/food') {
      const { food_id, food } = data;
      await pg.query(`
        INSERT INTO food_data (food_id, food, timestamp)
        VALUES ($1, $2, NOW())
      `, [food_id, food]);

    } else if (topic === 'sensors/hour') {
      const { time_id, hour, minute } = data;
      await pg.query(`
        INSERT INTO hour_data (time_id, hour, minute, timestamp)
        VALUES ($1, $2, $3, NOW())
      `, [time_id, hour, minute]);
    }

  } catch (err) {
    console.error('❌ MQTT error:', err.message);
  }
});

module.exports = client;
