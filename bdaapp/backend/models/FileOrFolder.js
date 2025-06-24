const mongoose = require("mongoose");

const fileOrFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["file", "folder", "symlink"], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  size: { type: Number, default: 0 },
  content: { type: String, maxlength: 10240 },
  tags: [{ type: String, lowercase: true }],
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("FileOrFolder", fileOrFolderSchema);
