const express = require("express");
const router = express.Router();
const { registerToken } = require("../controllers/tokenController");

// register FCM token ke DB
router.post("/register-token", registerToken);

module.exports = router;
