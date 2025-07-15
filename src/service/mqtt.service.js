const pg = require('../db');

async function handleMqttMessage(topic, payload) {
  try {
    const data = JSON.parse(payload.toString());

    if (topic === 'sensors/telemetry') {
      const { device_id, templand, watertemp, ph, turbidity, humidity, timestamp } = data;
      const ts = timestamp || new Date().toISOString();

      await pg.query(`
        INSERT INTO sensor_data (
          device_id, templand, watertemp, ph, turbidity, humidity, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [device_id, templand, watertemp, ph, turbidity, humidity, ts]);

      console.log('💾 Telemetry data saved');

    } else if (topic === 'sensors/food') {
      const { food_id, food } = data;

      await pg.query(`
        INSERT INTO food_data (
          food_id, food, timestamp
        ) VALUES ($1, $2, NOW())
      `, [food_id, food]);

      console.log('💾 Food data saved');

    } else if (topic === 'sensors/hour') {
      const { time_id, hour, minute } = data;

      await pg.query(`
        INSERT INTO hour_data (
          time_id, hour, minute, timestamp
        ) VALUES ($1, $2, $3, NOW())
      `, [time_id, hour, minute]);

      console.log('💾 Hour data saved');

    } else {
      console.warn('⚠️ Unknown topic received:', topic);
    }

  } catch (err) {
    console.error('❌ Error processing MQTT message:', err.message);
  }
}

module.exports = {
  handleMqttMessage,
};
