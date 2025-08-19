import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import prisma from "@/lib/db";
import { sendNotification } from "@/lib/notif";

const app = new Hono();

// Get all sensor data (latest 100 records)
app.get('/', async (c) => {
    try {
        const result = await prisma.sensors_data.findMany({
            orderBy: {
                timestamp: 'desc'
            },
            take: 100
        });
        return c.json(result);
    } catch (err) {
        return c.json({ error: 'DB error' }, 500);
    }
});

// Get latest sensor data
app.get('/latest', async (c) => {
    try {
        const result = await prisma.sensors_data.findFirst({
            orderBy: {
                timestamp: 'desc'
            }
        });
        
        if (!result) {
            return c.json({ error: 'No data' }, 404);
        }
        
        return c.json(result);
    } catch (err) {
        return c.json({ error: 'DB error' }, 500);
    }
});

// Post telemetry data
app.post('/telemetry',
    zValidator('json', z.object({
        device_id: z.string(),
        templand: z.number(),
        watertemp: z.number(),
        ph: z.number(),
        turbidity: z.number(),
        humidity: z.number(),
        waterlevel: z.number(),
        isipakan: z.number()
    })),
    async (c) => {
        try {
            const { device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan } = c.req.valid('json');
            const ts = new Date().toISOString();

            const result = await prisma.sensors_data.create({
                data: {
                    device_id,
                    templand,
                    watertemp,
                    ph,
                    turbidity,
                    humidity,
                    waterlevel,
                    isipakan,
                    timestamp: ts
                }
            });

            console.log("💾 Data disimpan:", turbidity);

            // 🚨 Cek kondisi turbidity
            if (turbidity > 100) {
                console.log("📢 Notifikasi needed (turbidity > 100)");
                sendNotification("⚠️ Peringatan turbidity level", 
                    `Level turbidity telah melebihi batas aman: ${turbidity} (>100)`
                );
            }

            return c.json({ success: true, data: result });
        } catch (err) {
            console.error("❌ Error:", err);
            return c.json({ error: 'DB error' }, 500);
        }
    }
);

// Check online status
app.get('/online', async (c) => {
    try {
        const result = await prisma.sensors_data.findFirst({
            orderBy: {
                timestamp: 'desc'
            },
            select: {
                timestamp: true
            }
        });

        if (!result) {
            return c.json({ online: false, message: 'No data received yet' });
        }

        const lastTimestamp = new Date(result.timestamp);
        const now = new Date();
        const diffInSeconds = (now.getTime() - lastTimestamp.getTime()) / 1000;

        if (diffInSeconds <= 10) {
            return c.json({ online: true, lastSeen: lastTimestamp.toISOString() });
        } else {
            return c.json({ online: false, lastSeen: lastTimestamp.toISOString() });
        }
    } catch (err) {
        console.error('❌ Error checking online status:', err);
        return c.json({ error: 'Server error' }, 500);
    }
});

export default app;