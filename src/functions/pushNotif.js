const express = require('express');
const router = express.Router();
const pg = require('../db');
const admin = require('firebase-admin');
const fb = require('../functions/firebase'); // file firebase.js yang sudah kita buat

// Fungsi kirim push notification
async function sendNotification(tokens, message) {
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    },
  };

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log('✅ Push notification terkirim:', response);
  } catch (err) {
    console.error('❌ Gagal mengirim push notification:', err);
  }
}

// Fungsi ambil semua FCM token dari Firestore
async function getAllFCMTokens() {
  try {
    const snapshot = await fb.collection('tokens').get();
    if (snapshot.empty) {
      console.log('⚠️ Tidak ada token.');
      return [];
    }

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    return tokens;
  } catch (err) {
    console.error('❌ Error mengambil token:', err);
    return [];
  }
}

// Endpoint untuk cek data terbaru dan kirim push jika turbidity >= 120
router.get('/check-turbidity', async (req, res) => {
  try {
    const { rows } = await pg.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1');
    if (rows.length === 0) return res.status(404).json({ error: 'No data' });

    const latest = rows[0];
    
    // Cek turbidity
    if (latest.turbidity >= 120) {
      const tokens = await getAllFCMTokens();
      if (tokens.length > 0) {
        await sendNotification(tokens, { title: 'Peringatan!', body: 'Air Keruh' });
      }
    }

    res.json({ latest, message: latest.turbidity >= 120 ? 'Notification sent' : 'Turbidity normal' });
  } catch (err) {
    console.error('❌ Error check-turbidity:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
