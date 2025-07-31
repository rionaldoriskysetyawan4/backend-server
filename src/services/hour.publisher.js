const pg = require('../db');
const mqttClient = require('../mqtt');

async function publishHourData() {
    try {
        const { rows } = await pg.query(`
            SELECT * FROM hour_data
            WHERE id BETWEEN 1 AND 5
            ORDER BY id ASC
        `);

        const dataToSend = rows.map(row =>
            `${row.id},${row.time_id},${row.hour},${row.minute},${row.isactive}`
        ).join('\n');

        const topic = 'sensors/hour/list';
        // publish segera dan retained
        mqttClient.publish(
            topic,
            JSON.stringify(dataToSend),
            { qos: 1, retain: true },
            err => {
                if (err) console.error('❌ Failed to publish hour list:', err);
                else console.log('✅ Published (retained) hour list to MQTT');
            }
        );
    } catch (err) {
        console.error('❌ Error querying hour data:', err);
    }
}

module.exports = publishHourData;
