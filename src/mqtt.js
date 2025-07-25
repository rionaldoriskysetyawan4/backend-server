const mqtt = require('mqtt');
const { handleMqttMessage } = require('./services/mqtt.service');

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
            if (err) console.error(`❌ Failed to subscribe to ${topic}:`, err);
            else console.log(`🔔 Subscribed to topic: ${topic}`);
        });
    });
});

client.on('message', (topic, payload) => {
    handleMqttMessage(topic, payload);
});

module.exports = client;
