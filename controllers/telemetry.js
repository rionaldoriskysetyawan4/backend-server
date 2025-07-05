const db = require('../db'); // util yang bikin pool pg

exports.insertTelemetry = async (req, res) => {
  const { temperature, humidity, timestamp } = req.body;
  try {
    const query = `
      INSERT INTO telemetry (temperature, humidity, timestamp)
      VALUES ($1, $2, $3) RETURNING *`;
    const { rows } = await db.query(query, [temperature, humidity, timestamp]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to insert telemetry' });
  }
};

exports.getAllTelemetry = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM telemetry ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
};
