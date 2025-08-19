
import prisma from "@/lib/db";

export async function handleMqttMessage(topic: string, payload: Buffer | string): Promise<void> {
    try {
        const payloadString = typeof payload === "string" ? payload : payload.toString();
        const data = JSON.parse(payloadString);

        if (topic === "sensors/telemetry") {
            const { device_id, templand, watertemp, ph, turbidity, humidity, waterlevel, isipakan, timestamp } = data;
            const ts = timestamp || new Date().toISOString();

            await prisma.sensors_data.create({
                data: {
                    device_id,
                    templand,
                    watertemp,
                    ph,
                    turbidity,
                    humidity,
                    waterlevel,
                    isipakan,
                    timestamp: ts,
                },
            });
            console.log("💾 Telemetry data saved");
        }

        else if (topic === "sensors/food") {
            try {
                const { action, id, food_id, food, timestamp } = data;
                if (action === "update") {
                    await prisma.food_data.update({
                        where: { id },
                        data: {
                            food_id,
                            food,
                            timestamp: timestamp || new Date().toISOString(),
                        },
                    });
                    console.log(`✏️ Food data updated via MQTT [id: ${id}]`);
                } else {
                    await prisma.food_data.create({
                        data: {
                            food_id,
                            food,
                            timestamp: timestamp || new Date().toISOString(),
                        },
                    });
                    console.log("💾 New food data saved via MQTT");
                }
            } catch (err) {
                console.error("❌ Failed to process MQTT sensors/food:", err);
            }
        }

        else if (topic === "sensors/hour") {
            const { time_id, hour, minute, isactive } = data;
            await prisma.hour_data.create({
                data: {
                    time_id,
                    hour,
                    minute,
                    isactive,
                    timestamp: new Date().toISOString(),
                },
            });
            console.log("💾 Hour data saved");
        }

        else {
            console.warn("⚠️ Unknown topic received:", topic);
        }

    } catch (err: any) {
        console.error("❌ Error processing MQTT message:", err.message);
    }
}
