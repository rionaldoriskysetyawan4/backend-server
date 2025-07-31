const pg = require('../db');
const mqttClient = require('../mqtt');

async function publishFoodData() {
    try {
        const { rows } = await pg.query(`
            SELECT * FROM food_data
            WHERE id BETWEEN 1
        `);

        const dataToSend = rows.map(row =>
            `${row.id},${row.food_id},${row.food}`
        ).join('\n');

        const topic = 'sensors/food/list';
        // publish segera dan retained
        mqttClient.publish(
            topic,
            dataToSend,
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

module.exports = publishFoodData;
