import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { success, z } from "zod";
import { client as mqttClient } from "@/lib/mqtt"; // Adjust the import path as necessary
import prisma from "@/lib/db";

const app = new Hono();

// list hour data
app.get('/',
    async (c) => {
        const result = await prisma.food_data.findMany();
        return c.json(result);
    }
);

// get specific hour data
app.get('/:id',
    zValidator('param', z.object({
        id: z.number()
    })),
    async (c) => {
        const { id } = c.req.valid('param');
        
        // get first data from food_data match id
        const result = await prisma.food_data.findFirst({
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
        id: z.number()
    })),
    zValidator('json', z.object({
        food_id: z.optional(z.string()),
        food: z.optional(z.number())
    })),
    async (c) => {
        const { id } = c.req.valid('param');
        const { food_id, food } = c.req.valid('json');

        const result = await prisma.food_data.update({
            where: {
                id
            },
            data: {
                food_id,
                food
            }
        });

        const topic = 'sensors/food/update';
        const message = `${result.food_id},${result.food}`;

        mqttClient.publish(topic, message, { qos: 1 }, (err: any) => {
            if (err) {
                console.error(`❌ Failed to publish to topic ${topic}:`, err);
                return c.json({ error: "Failed to publish MQTT message" }, 500);
            }
            console.log(`✅ Published food update to topic ${topic}`);
            return c.json({ success: true, data: result, published: true });
        });

        return c.json({ success: true, data: result, published: false });
    }
)

export default app;