require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mqtt = require('./mqtt'); // Initialize MQTT
const foodRoutes = require('./routes/food.routes');
const hourRoutes = require('./routes/hour.routes');
const telemetryRoutes = require('./routes/telemetry.routes');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/food', foodRoutes);
app.use('/api/hour', hourRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
