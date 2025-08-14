// backend/server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- CORS ----
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: (origin, cb) => {
      // allow no-origin (e.g. curl) and the configured frontend
      if (!origin || origin === FRONTEND_ORIGIN) return cb(null, true);
      return cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ---- Mongo (optional if you're not using it right now) ----
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err.message));
}

// ---- API key endpoint (single source of truth) ----
let cachedKey = null;
app.get("/api-ke", (req, res) => {
  try {
    if (!cachedKey) cachedKey = process.env.QO_API_KEY || "";
    if (!cachedKey) {
      return res.status(500).json({ error: "QO_API_KEY missing on server" });
    }
    // no sensitive caching in proxies; short client cache is OK
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.json({ key: cachedKey });
  } catch (e) {
    console.error("api-ke error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Your existing routes (optional right now) ----
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/files", require("./routes/files"));

// ---- Error handler (prevents raw 500s) ----
app.use((err, req, res, next) => {
  console.error("Unhandled:", err.message);
  if (err.message?.startsWith("CORS:")) {
    return res
      .status(403)
      .setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN)
      .json({ error: err.message });
  }
  res
    .status(500)
    .setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN)
    .json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Allowing CORS from: ${FRONTEND_ORIGIN}`);
});