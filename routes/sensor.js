const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
  try {
    const { temperature, humidity, timestamp } = req.body;
    const result = await db.query(
 "INSERT INTO sensor_data (temperature, humidity, pump_out, timestamp) VALUES ($1, $2, $3, $4)",
  [temperature, humidity, pump_out, timestamp]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
