const pg = require('../db');
const mqttClient = require('../mqtt');

async function publishHourData() {
    try {
        const { rows } = await pg.query('SELECT * FROM hour_data ORDER BY id ASC LIMIT 5');

        const dataToSend = rows.map(row => ({
            id: row.id,
            time_id: row.time_id,
            hour: row.hour,
            minute: row.minute,
            isactive: row.isactive
        }));

        const topic = 'sensors/hour/list';
        mqttClient.publish(topic, JSON.stringify(dataToSend), { qos: 1 }, err => {
            if (err) {
                console.error('❌ Failed to publish hour list:', err);
            } else {
                console.log('✅ Published hour list to MQTT');
            }
        });

    } catch (err) {
        console.error('❌ Error querying hour data:', err);
    }
}

module.exports = publishHourData;
