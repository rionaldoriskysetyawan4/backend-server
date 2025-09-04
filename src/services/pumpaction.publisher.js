const mqttClient = require('./mqtt.service');
const { getLatestWaterlevel } = require('../routes/action.routes');

async function publishPumpAction() {
  try {
    const waterlevel = await getLatestWaterlevel();

    if (waterlevel !== null) {
      console.log('📡 PumpAction Publisher - waterlevel:', waterlevel);

      // publish ke topic
      mqttClient.publish('smfish/waterlevel', JSON.stringify({ waterlevel }));
    } else {
      console.log('⚠️ Tidak ada data waterlevel');
    }
  } catch (err) {
    console.error('❌ Error in pumpaction.publisher:', err.message);
  }
}

// otomatis tiap 5 detik
setInterval(publishPumpAction, 5000);

module.exports = publishPumpAction;
