const mqttClient = require('./mqtt.service');
const { getLatestWaterlevel } = require('../routes/action.routes');

const topic = 'sensors/pump1'; // sesuai permintaan

async function publishPumpAction() {
  try {
    const waterlevel = await getLatestWaterlevel();

    if (waterlevel === null) {
      console.log('⚠️ Tidak ada data waterlevel');
      return;
    }

    // logika kontrol pompa
    let pumpvalue = 0;
    if (waterlevel > 1500) {
      pumpvalue = 1; // nyalakan pompa
    } else {
      pumpvalue = 0; // matikan pompa
    }

    // payload sesuai format
    const payload = JSON.stringify({ pump1: pumpvalue });

    mqttClient.publish(topic, payload, { qos: 1, retain: true }, err => {
      if (err) {
        console.error('❌ Failed to publish pump action:', err);
      } else {
        console.log(`✅ Published to MQTT (${topic}):`, payload);
      }
    });
  } catch (err) {
    console.error('❌ Error in pumpaction.publisher:', err.message);
  }
}

// otomatis tiap 5 detik
setInterval(publishPumpAction, 5000);

module.exports = publishPumpAction;
