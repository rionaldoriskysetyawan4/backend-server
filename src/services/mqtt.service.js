const pg = require('../db');

async function handleMqttMessage(topic, payload) {
    try {
        const data = JSON.parse(payload.toString());

        if (topic === 'sensors/telemetry') {
            // Misal update data terbaru dari ESP
            updateLatestData(message);
        }

        else if (topic === 'sensors/food') {
            const { action, id, food_id, food, timestamp } = data;

            if (action === 'update') {
                await pg.query(`
            UPDATE food_data
            SET food_id = $1, food = $2, timestamp = $3
            WHERE id = $4
        `, [food_id, food, timestamp, id]);

                console.log(`✏️ Food data updated via MQTT [id: ${id}]`);
            } else {
                await pg.query(`
            INSERT INTO food_data (
                food_id, food, timestamp
            ) VALUES ($1, $2, NOW())
        `, [food_id, food]);

                console.log('💾 New food data saved via MQTT');
            }
        }


        else if (topic === 'sensors/hour') {
            const { time_id, hour, minute, isactive } = data;

            await pg.query(`
            INSERT INTO hour_data (
            time_id, hour, minute, isactive, timestamp,
            ) VALUES ($1, $2, $3, $4, NOW())
            `, [time_id, hour, minute, isactive]);

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
