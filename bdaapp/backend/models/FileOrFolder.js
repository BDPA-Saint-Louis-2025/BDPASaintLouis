const mongoose = require("mongoose");

const fileOrFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["file", "folder"], required: true },
  content: { type: String, default: "" },
  tags: [{ type: String }],
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "FileOrFolder", default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  size: { type: Number, default: 0 },
  modifiedAt: { type: Date, default: Date.now },
  lock: {
    user: { type: String, default: null },
    client: { type: String, default: null },
    createdAt: { type: Date, default: null }
  }
});

module.exports = mongoose.model("FileOrFolder", fileOrFolderSchema);
