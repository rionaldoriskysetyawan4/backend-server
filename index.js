const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post("/emqx-webhook", async (req, res) => {
  const { device_id, temperature, humidity } = req.body;
  try {
    await pool.query(
      `INSERT INTO sensor_data (device_id, temperature, humidity) VALUES ($1, $2, $3)`,
      [device_id, temperature, humidity]
    );
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db insert failed" });
  }
});

app.get("/sensor-data", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db fetch failed" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Backend listening on port ${port}`);
});
