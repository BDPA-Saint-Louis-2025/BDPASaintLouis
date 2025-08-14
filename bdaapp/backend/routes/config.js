// backend/routes/config.js
const express = require("express");
const router = express.Router();

router.get("/api-key", (req, res) => {
  res.json({ key: process.env.QO_API_KEY });
});

module.exports = router;