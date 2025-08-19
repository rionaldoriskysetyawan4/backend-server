import { sendNotification } from "@/lib/notif";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

app.post('/send-test', 
    zValidator('json', z.object({
        title: z.optional(z.string().max(48)),
        message: z.optional(z.string().max(128))
    })),
    async (c) => {
        const { title, message } = c.req.valid('json')
        const finalTitle = title ?? '👋🏻 Hai!'
        const finalMessage = message ?? 'Tes notifikasi telah berhasil dikirim!'
        sendNotification(finalTitle, finalMessage)
        return c.json({ success: true })
    }
);

export default app;