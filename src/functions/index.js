const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendTurbidityAlert = functions.firestore
  .document('railway/{railwayId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const turbidity = after.turbidity;

    // Cek apakah nilai turbidity lebih dari 100
    if (turbidity > 100) {
      // Ambil semua token FCM dari Firestore
      const tokensSnapshot = await admin.firestore().collection('fcm_tokens').get();
      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length > 0) {
        const payload = {
          notification: {
            title: 'Peringatan Tingkat Kekeruhan',
            body: `Tingkat kekeruhan di railway ${context.params.railwayId} melebihi batas aman.`,
          },
        };

        try {
          // Kirim notifikasi ke semua token
          await admin.messaging().sendToDevice(tokens, payload);
          console.log('Notifikasi berhasil dikirim');
        } catch (error) {
          console.error('Gagal mengirim notifikasi:', error);
        }
      }
    }
  });
