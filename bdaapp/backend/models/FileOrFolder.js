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
lock: {
  user: { type: String, default: null },    // username of the locker
  client: { type: String, default: null },  // client ID of the locker
  uploadPath: { type: String },
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
}
});


module.exports = mongoose.model("FileOrFolder", fileOrFolderSchema);
