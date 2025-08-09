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
  uploadPath: { type: String },
  nameOnDisk: { type: String },
  mimeType: { type: String, default: 'application/octet-stream' },
  isPublic: { type: Boolean, default: false },
  lock: {
    user: { type: String, default: null },
    client: { type: String, default: null },
    createdAt: { type: Date, default: null }
  },
  permissions: {
    type: Map,
    of: String,
    default: {}
  },
  symlinkTarget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileOrFolder',
    default: null
  },
  publicLinkId: { type: String, default: null }
});


module.exports = mongoose.model("FileOrFolder", fileOrFolderSchema);
