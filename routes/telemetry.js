const express = require('express');
const router = express.Router();
const { insertTelemetry, getAllTelemetry } = require('../controllers/telemetry');

// POST /api/telemetry
router.post('/', insertTelemetry);

// GET  /api/telemetry
router.get('/', getAllTelemetry);

module.exports = router;
