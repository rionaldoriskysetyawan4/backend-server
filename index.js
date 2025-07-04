const express = require("express");
const cors = require("cors");
const sensorRoute = require("./routes/sensor");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/sensor", sensorRoute);

app.get("/", (req, res) => {
  res.send("Backend for EMQX MQTT is running.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
