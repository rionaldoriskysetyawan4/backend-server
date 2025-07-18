const express = require('express');
const pg = require('../db');
const router = express.Router();

router.get('/online', (req, res) => {
    const now = Date.now();
    const diff = lastSeen ? (now - lastSeen) / 10000 : null;

    const isOnline = diff !== null && diff < 15;

    res.json({
        status: isOnline ? 'online' : 'offline',
        lastSeen: lastSeen ? new Date(lastSeen).toISOString() : null,
        secondsAgo: diff !== null ? Math.round(diff) : null
    });
});