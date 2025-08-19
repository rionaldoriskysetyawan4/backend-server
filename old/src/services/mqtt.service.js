const pg = require('../db');
// const { updateLatestData } = require('../routes/telemetry.routes');

async function handleMqttMessage(topic, payload) {
    try {
        const payloadString = payload.toString();
        const data = JSON.parse(payloadString);

        if (topic === 'sensors/telemetry') {
            const { device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, timestamp } = data;
            const ts = timestamp || new Date().toISOString();

            await pg.query(`
            INSERT INTO sensor_data (
            device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, ts]);

            console.log('💾 Telemetry data saved');
        }

        if (topic === 'sensors/food') {
            try {
                const data = JSON.parse(payload);
                const { action, id, food_id, food, timestamp } = data;

                if (action === 'update') {
                    await pg.query(`
                    UPDATE food_data
                    SET food_id = $1, food = $2, timestamp = $3
                    WHERE id = $4
                `, [food_id, food, timestamp || new Date().toISOString(), id]);

                    console.log(`✏️ Food data updated via MQTT [id: ${id}]`);
                } else {
                    await pg.query(`
                    INSERT INTO food_data (food_id, food, timestamp)
                    VALUES ($1, $2, $3)
                `, [food_id, food, timestamp || new Date().toISOString()]);

                    console.log('💾 New food data saved via MQTT');
                }
            } catch (err) {
                console.error('❌ Failed to process MQTT sensors/food:', err);
            }
        }


        else if (topic === 'sensors/hour') {
            const { time_id, hour, minute, isactive } = data;

            await pg.query(`
            INSERT INTO hour_data (
            time_id, hour, minute, isactive, timestamp) 
            VALUES ($1, $2, $3, $4, NOW())
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
