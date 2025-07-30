const mqtt = require('mqtt');
const { handleMqttMessage } = require('./services/mqtt.service');
const http = require('http'); // Tidak digunakan di sini tapi tetap disiapkan jika diperlukan

// Konfigurasi koneksi MQTT
const mqttUrl = `mqtt://${process.env.EMQX_HOST}:${process.env.EMQX_PORT}`;
const mqttOptions = {
    username: process.env.EMQX_USERNAME,
    password: process.env.EMQX_PASSWORD,
};

// Inisialisasi koneksi MQTT
const client = mqtt.connect(mqttUrl, mqttOptions);

client.on('connect', () => {
    console.log('✅ Connected to EMQX MQTT');

    // Topik yang ingin disubscribe
    const topics = ['sensors/telemetry', 'sensors/hour', 'sensors/food'];

    topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, err => {
            if (err) {
                console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
                console.log(`🔔 Subscribed to topic: ${topic}`);
            }
        });
    });
});

// Tangani pesan yang masuk dari broker MQTT
client.on('message', (topic, payload) => {
    try {
        handleMqttMessage(topic, payload);
    } catch (err) {
        console.error(`❌ Error handling message on topic ${topic}:`, err);
    }
});

module.exports = client;
