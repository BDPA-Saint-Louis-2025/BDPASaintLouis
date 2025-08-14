// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000/" })); // allow your front-end
app.use(express.json());

// ===== ADD THIS ROUTE =====
app.get("/api-ke", (req, res) => {
  const key = (process.env.VITE_QO_API_KEY || process.env.QO_API_KEY || "").trim();
  if (!key) return res.status(500).json({ error: "Missing VITE_QO_API_KEY in .env" });
  res.json({ key });
});
// ==========================

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/files", require("./routes/files"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));