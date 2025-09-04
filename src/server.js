require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mqtt = require('./mqtt'); // Initialize MQTT
const foodRoutes = require('./routes/food.routes');
const hourRoutes = require('./routes/hour.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const publishHourData = require('./services/hour.publisher');
const publishFoodData = require('./services/food.publisher');
const pumpActionPublisher = require('./services/pumpaction.publisher');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// jalanin sekali saat startup
publishHourData();
publishFoodData();
pumpActionPublisher();
// terus setiap 5 detik (ubah ke 1000ms kalau mau tiap detik)
setInterval(publishHourData, 5000);
setInterval(publishFoodData, 5000);
setInterval(pumpActionPublisher, 5000);

// API Routes
app.use('/api/food', foodRoutes);
app.use('/api/hour', hourRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
