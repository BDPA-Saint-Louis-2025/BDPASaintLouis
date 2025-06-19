const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log("MONGO_URI:", process.env.MONGO_URI); // Remove this after it's working

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

app.use("/api/auth", require("./routes/auth"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
