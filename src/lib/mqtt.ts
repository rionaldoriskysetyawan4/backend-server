import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { handleMqttMessage } from '@/services/mqtt.service';

const mqttUrl: string = `mqtt://${process.env.EMQX_HOST}:${process.env.EMQX_PORT}`;
const mqttOptions: IClientOptions = {
    username: process.env.EMQX_USERNAME,
    password: process.env.EMQX_PASSWORD,
};

export const client: MqttClient = mqtt.connect(mqttUrl, mqttOptions);

client.on('connect', () => {
    console.log('✅ Connected to EMQX MQTT');

    const topics: string[] = ['sensors/telemetry', 'sensors/hour', 'sensors/food'];

    topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, (err?: Error) => {
            if (err) {
                console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
                console.log(`🔔 Subscribed to topic: ${topic}`);
            }
        });
    });
});

client.on('message', async (topic: string, message: Buffer) => {
    try {
        await handleMqttMessage(topic, message);
    } catch (err) {
        console.error(`❌ Error handling message on topic ${topic}:`, err);
    }
});

export default client;
