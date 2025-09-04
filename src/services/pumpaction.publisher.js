// app.js
const mqttClient = require('../mqtt');
const { getLatestWaterlevel } = require('./services/getLatestWaterlevel');

const topic = 'sensors/pump1'; // sesuai permintaan

async function main() {
  try {
    const waterlevel = await getLatestWaterlevel();
    let pumpvalue = 0; // default matikan pompa

    if (waterlevel === null) {
      console.log('❌ No waterlevel data found');
      return;
    }

    // Logika kontrol pompa
    if (waterlevel > 1500) {
      pumpvalue = 1; // nyalakan pompa
    } else {
      pumpvalue = 0; // matikan pompa
    }

    // Payload sesuai format yang kamu minta
    const dataToSend = JSON.stringify({ pump1: pumpvalue });

    // Publish ke MQTT
    mqttClient.publish(
      topic,
      dataToSend,
      { qos: 1, retain: true },
      err => {
        if (err) {
          console.error('❌ Failed to publish data:', err);
        } else {
          console.log(`✅ Published to MQTT (${topic}):`, dataToSend);
        }
      }
    );
  } catch (err) {
    console.error('❌ Gagal ambil waterlevel:', err.message || err);
  }
}

main();
