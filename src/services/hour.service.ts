import prisma from "@/lib/db";
import mqttClient from "@/lib/mqtt";

export async function publishHourData(): Promise<void> {
    try {
        const result = await prisma.hour_data.findMany({
            where: {
                id: {
                    gte: 1,
                    lte: 5
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        const dataToSend = result.map(row =>
            `${row.id},${row.time_id},${row.hour},${row.minute},${row.isactive}`
        ).join('\n');

        const topic = 'sensors/hour/list';
        
        // publish segera dan retained
        mqttClient.publish(
            topic,
            dataToSend,
            { qos: 1, retain: true },
            (err?: Error) => {
                if (err) {
                    console.error('❌ Failed to publish hour list:', err);
                } else {
                    console.log('✅ Published (retained) hour list to MQTT');
                }
            }
        );
    } catch (err) {
        console.error('❌ Error querying hour data:', err);
    }
}