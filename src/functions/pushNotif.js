const admin = require('firebase-admin');

async function sendNotification(tokens, message) {
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    }
  };

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log('Push notification terkirim:', response);
  } catch (err) {
    console.error('Gagal mengirim push notification:', err);
  }
}
