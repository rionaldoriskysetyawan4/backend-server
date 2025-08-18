const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.post("/", tokenController.saveToken);   // simpan token dari client
router.get("/", tokenController.getTokens);    // ambil semua token dari DB

module.exports = router;
