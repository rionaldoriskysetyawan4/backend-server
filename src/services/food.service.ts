import prisma from "@/lib/db";
import mqttClient from "@/lib/mqtt";

export async function publishFoodData(): Promise<void> {
    try {
        const result = await prisma.food_data.findMany({
            where: {
                id: 1
            }
        });

        const dataToSend = result.map(row =>
            `${row.id},${row.food_id},${row.food}`
        ).join('\n');

        const topic = 'sensors/food/list';
        
        // publish segera dan retained
        mqttClient.publish(
            topic,
            dataToSend,
            { qos: 1, retain: true },
            (err?: Error) => {
                if (err) {
                    console.error('❌ Failed to publish food list:', err);
                } else {
                    console.log('✅ Published (retained) food list to MQTT');
                }
            }
        );
    } catch (err) {
        console.error('❌ Error querying food data:', err);
    }
}