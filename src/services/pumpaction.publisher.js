// src/services/pumpaction.publisher.js
const mqttClient = require('../mqtt'); // pastikan ini meng-export client mqtt
const { getLatestWaterlevel } = require('../routes/action.routes');

const topic = 'sensors/pump1';
const intervalMs = 5000; // cek tiap 5 detik (ubah kalau perlu)

// state terakhir untuk mencegah spam
let lastPumpValue = null;

/**
 * Publish only when pump value changes.
 */
async function publishPumpAction() {
  try {
    const waterlevel = await getLatestWaterlevel();
    // jika tidak ada data, skip
    if (waterlevel === null || waterlevel === undefined) {
      console.log('[pumpaction] ⚠️ no waterlevel - skip');
      return;
    }

    const wlNum = Number(waterlevel);
    if (Number.isNaN(wlNum)) {
      console.error('[pumpaction] ❌ waterlevel not a number:', waterlevel);
      return;
    }

    // logika kontrol pompa (ubah threshold kalau perlu)
    const pumpValue = wlNum > 1500 ? 1 : 0;

    // hanya publish jika berubah (atau pertama kali lastPumpValue === null)
    if (lastPumpValue === pumpValue) {
      // tidak publish → menghindari spam
      // (hapus/koment log ini jika ingin silent)
      console.log(`[pumpaction] no change (pump=${pumpValue}) - skip publish`);
      return;
    }

    // siapkan payload
    const payload = JSON.stringify({ pump1: pumpValue });

    // pastikan mqtt client valid
    if (!mqttClient || typeof mqttClient.publish !== 'function') {
      console.error('[pumpaction] ❌ mqtt client not ready or incorrect export');
      return;
    }

    // publish (qos 1, retained)
    mqttClient.publish(topic, payload, { qos: 1, retain: true }, err => {
      if (err) {
        console.error('[pumpaction] ❌ publish error:', err);
      } else {
        console.log(`[pumpaction] ✅ Published to ${topic}:`, payload);
        // update state hanya jika publish sukses
        lastPumpValue = pumpValue;
      }
    });
  } catch (err) {
    console.error('[pumpaction] ❌ Error:', err && err.message ? err.message : err);
  }
}

// run once immediately (opsional — akan publish pertama kali)
publishPumpAction();

// interval cek berkala (tetap tidak akan spam karena cek perubahan)
setInterval(publishPumpAction, intervalMs);

// export supaya bisa di-require di index/server
module.exports = publishPumpAction;
