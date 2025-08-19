import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { success, z } from "zod";
import { client as mqttClient } from "@/lib/mqtt"; // Adjust the import path as necessary
import prisma from "@/lib/db";

const app = new Hono();

// list hour data
app.get('/',
    async (c) => {
        const result = await prisma.hour_data.findMany();
        return c.json(result);
    }
);

// get specific hour data
app.get('/:id',
    zValidator('param', z.object({
        id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    })),
    async (c) => {
        const { id } = c.req.valid('param')

        // get first data from hour_data match id
        const result = await prisma.hour_data.findFirst({
            where: {
                id
            }
        });

        if (!result) {
            return c.json({ error: "Data not found" })
        }

        // return raw data, literally
        return c.json(result);
    }
)

app.put('/:id',
    zValidator('param', z.object({
        id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    })),
    zValidator('json', z.object({
        time_id: z.optional(z.string()),
        hour: z.optional(z.number().min(0).max(23)),
        minute: z.optional(z.number().min(0).max(59)),
        isactive: z.optional(z.boolean())
    })),
    async (c) => {
        const { id } = c.req.valid('param')
        const { time_id, hour, minute, isactive } = c.req.valid('json');

        const result = await prisma.hour_data.update({
            where: {
                id
            },
            data: {
                time_id,
                hour,
                minute,
                isactive
            }
        });

        const topic = 'sensors/hour/update';
        const message = `${result.time_id},${result.hour},${result.minute},${result.isactive}`;

        mqttClient.publish(topic, message, { qos: 1 }, (err: any) => {
            if (err) {
                console.error(`❌ Failed to publish to topic ${topic}:`, err);
                return c.json({ error: "Failed to publish MQTT message" }, 500);
            }
            console.log(`✅ Published hour update to topic ${topic}`);
            return c.json({ success: true, data: result, published: true });
        });

        return c.json({ success: true, data: result, published: false });
    }
)

export default app;