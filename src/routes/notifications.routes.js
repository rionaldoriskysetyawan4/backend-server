const express = require("express");
const router = express.Router();
const { sendToAll } = require("../controllers/notifController");

// trigger push notif ke semua user
router.post("/send-to-all", sendToAll);

module.exports = router;
