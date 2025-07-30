const express = require('express');
const router = express.Router();

// Simpan data terbaru dari ESP di sini
let latestData = {};
let lastUpdate = null;

// Fungsi untuk mendapatkan data terbaru
function getLatestData() {
    return latestData;
}

// Fungsi untuk memperbarui data (panggil saat menerima data dari MQTT)
function updateLatestData(newData) {
    latestData = newData;
    lastUpdate = new Date(); // simpan waktu update
}

// Route: /latest
router.get('/latest', (req, res) => {
    const data = getLatestData();
    if (Object.keys(data).length === 0) {
        return res.status(404).json({ error: 'Belum ada data' });
    }
    res.json(data);
});

// Route: /online
router.get('/online', (req, res) => {
    if (!lastUpdate) {
        return res.status(404).json({ online: false, message: 'Belum ada data dari ESP' });
    }

    const now = new Date();
    const diffInSeconds = (now - lastUpdate) / 1000;

    // Anggap ESP online jika kirim data dalam 30 detik terakhir
    const isOnline = diffInSeconds < 30;

    res.json({
        online: isOnline,
        lastSeen: lastUpdate.toISOString(),
        secondsAgo: Math.round(diffInSeconds)
    });
});

// Export router dan fungsi update
module.exports = {
    router,
    updateLatestData
};
