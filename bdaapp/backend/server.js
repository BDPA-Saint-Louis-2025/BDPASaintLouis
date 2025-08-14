const configRoutes = require("./routes/config");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/files", require("./routes/files"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const configRoutes = require("./routes/config");