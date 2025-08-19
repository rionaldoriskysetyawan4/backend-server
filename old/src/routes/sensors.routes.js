const express = require("express");
const router = express.Router();
const { saveSensorData } = require("../controllers/sensorsController");

// endpoint terima data dari ESP32
router.post("/telemetry", saveSensorData);

module.exports = router;
