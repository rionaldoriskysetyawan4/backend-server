import { Hono } from 'hono';
import * as Routes from "@/routes";

import { client as mqttClient } from '@/lib/mqtt';
import { publishFoodData } from '@/services/food.service';
import { publishHourData } from '@/services/hour.service';

const app = new Hono();

app.route('/api/telemetry', Routes.telemetry);
app.route('/api/hour', Routes.hour);
app.route('/api/food', Routes.food);
app.route('/api/notif', Routes.notif);

// run publish
(() => {
    publishFoodData();
    publishHourData();
    setInterval(() => {
        publishFoodData();
        publishHourData();
    }, 5000);
    console.log('📡 MQTT data publisher started');
})

export default app;