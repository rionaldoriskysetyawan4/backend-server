// src/services/pumpaction.publisher.js
const { getLatestWaterlevel } = require('../routes/action.routes'); // pastikan path benar
const mqttClient = require('../mqtt'); // sesuaikan path ke file mqtt.js yang meng-export client

const topic = 'sensors/pump1';

async function publishPumpAction() {
  try {
    // ambil data dari route/service yang sudah ada
    const waterlevel = await getLatestWaterlevel();
    console.log('[pumpaction] fetched waterlevel:', waterlevel);

    if (waterlevel === null || waterlevel === undefined) {
      console.log('[pumpaction] ⚠️ no waterlevel data - skipping publish');
      return;
    }

    // Pastikan numeric (hindari string/format aneh)
    const wlNum = Number(waterlevel);
    if (Number.isNaN(wlNum)) {
      console.error('[pumpaction] ❌ waterlevel is not a number:', waterlevel);
      return;
    }

    // logika kontrol pompa
    const pumpvalue = wlNum > 1500 ? 1 : 0;
    const payload = JSON.stringify({ pump1: pumpvalue });

    // cek mqttClient
    if (!mqttClient || typeof mqttClient.publish !== 'function') {
      console.error('[pumpaction] ❌ mqttClient not ready or incorrect export from mqtt.js');
      return;
    }

    // jika mqtt belum connect, tunggu satu kali event 'connect' lalu publish
    if (!mqttClient.connected) {
      console.log('[pumpaction] ⏳ MQTT not connected yet, waiting for connect...');
      mqttClient.once('connect', () => {
        console.log('[pumpaction] 🔌 MQTT connected, now publishing...');
        mqttClient.publish(topic, payload, { qos: 1, retain: true }, err => {
          if (err) console.error('[pumpaction] ❌ publish error after connect:', err);
          else console.log(`[pumpaction] ✅ Published (after connect) ${topic}:`, payload);
        });
      });
      return;
    }

    // langsung publish jika mqtt connected
    mqttClient.publish(topic, payload, { qos: 1, retain: true }, err => {
      if (err) {
        console.error('[pumpaction] ❌ Failed to publish:', err);
      } else {
        console.log(`[pumpaction] ✅ Published to MQTT (${topic}):`, payload);
      }
    });
  } catch (err) {
    console.error('[pumpaction] ❌ Error in publishPumpAction:', err && err.message ? err.message : err);
  }
}

// jalankan otomatis tiap 5 detik (atau sesuaikan)
const intervalMs = 5000;
setInterval(publishPumpAction, intervalMs);

// export supaya bisa dipanggil manual di testing
module.exports = publishPumpAction;
