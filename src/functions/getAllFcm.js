const db = require('./firebase');

async function getAllFCMTokens() {
  try {
    const snapshot = await db.collection('tokens').get();
    if (snapshot.empty) {
      console.log('Tidak ada token.');
      return [];
    }

    const tokens = [];
    snapshot.forEach(doc => {
      // misal field token bernama 'token'
      tokens.push(doc.data().token);
    });

    return tokens;
  } catch (error) {
    console.error('Error mengambil token:', error);
    return [];
  }
}

// Contoh pemanggilan
getAllFCMTokens().then(tokens => {
  console.log('Semua FCM token:', tokens);
});
