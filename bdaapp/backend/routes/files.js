const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const FileOrFolder = require('../models/FileOrFolder');
const authMiddleware = require("../middleware/authMiddleware");

// Helper to check if user has permission
const hasPermission = (file, user) => {
  return (
    file.owner.toString() === user.id ||
    file.permissions?.[user.username] === 'view' ||
    file.permissions?.[user.username] === 'edit' ||
    file.permissions?.public === 'view'
  );
};

async function getOrCreateRecycleBin(userId) {
  let bin = await FileOrFolder.findOne({ 
    name: "Recycle Bin", 
    type: "folder", 
    parent: null, 
    owner: userId 
  });

  if (!bin) {
    bin = new FileOrFolder({
      name: "Recycle Bin",
      type: "folder",
      parent: null,
      owner: userId,
      tags: [],
      permissions: {}, // no permissions
    });
    await bin.save();
  }

  return bin;
}

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const isOwner = node.owner.equals(req.user._id);
    const canUnshare = node.permissions?.[req.user.username];

    // Can't delete others' stuff
    if (!isOwner && !canUnshare) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Recycle Bin itself is protected
    if (node.name === "Recycle Bin" && node.parent === null) {
      return res.status(403).json({ error: "Cannot delete the Recycle Bin folder" });
    }

    // Soft delete → move to bin
    const bin = await getOrCreateRecycleBin(req.user._id);
    node.parent = bin._id;
    await node.save();

    res.json({ message: "Moved to Recycle Bin" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error moving to Recycle Bin" });
  }
});

router.delete("/:id/hard", authMiddleware, async (req, res) => {
  try {
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const isOwner = node.owner.equals(req.user._id);
    if (!isOwner) return res.status(403).json({ error: "Unauthorized" });

    await FileOrFolder.deleteOne({ _id: node._id });
    res.json({ message: "Node permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error during hard delete" });
  }
});


router.put("/:id/restore", authMiddleware, async (req, res) => {
  try {
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const isOwner = node.owner.equals(req.user._id);
    if (!isOwner) return res.status(403).json({ error: "Unauthorized" });

    // Move back to root or previous parent if you tracked it
    node.parent = null;
    await node.save();

    res.json({ message: "Restored from Recycle Bin" });
  } catch (err) {
    res.status(500).json({ error: "Error restoring file" });
  }
});

// GET /api/files/myfiles
router.get('/myfiles', authMiddleware, async (req, res) => {
  try {
    const query = {
      parent: null,
      $or: [
        { owner: req.user.id },
        { [`permissions.${req.user.username}`]: { $in: ['view', 'edit'] } },
        { 'permissions.public': 'view' }
      ]
    };
    const files = await FileOrFolder.find(query);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user and clean up owned files
router.delete("/users/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // 1. Get all nodes owned by the user
    const userNodes = await FileModel.find({ owner: username });

    // 2. Filter nodes to delete: not shared or only public
    const toDelete = userNodes.filter((node) => {
      const permissions = node.permissions || {};
      const sharedWithUsers = Object.keys(permissions).filter(
        (key) => key !== "public"
      );
      const publicOnly = permissions.public === "view" && sharedWithUsers.length === 0;

      return sharedWithUsers.length === 0 || publicOnly;
    });

    // 3. Delete filtered nodes
    for (const node of toDelete) {
      await FileModel.deleteOne({ _id: node._id });
    }

    // 4. Delete Recycle Bin and its contents (if it exists)
    const recycleBin = await FileModel.findOne({ owner: username, name: "Recycle Bin" });
    if (recycleBin) {
      await FileModel.deleteMany({ parent: recycleBin._id });
      await FileModel.deleteOne({ _id: recycleBin._id });
    }

    // 5. Finally delete the user
    await UserModel.deleteOne({ username });

    return res.status(200).json({ message: "User and owned files deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user and files." });
  }
});




// GET /api/files/search
router.get('/search', authMiddleware, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Missing search query' });

  try {
    const results = await FileOrFolder.find({
      $or: [
        { owner: req.user.id },
        { [`permissions.${req.user.username}`]: { $in: ['view', 'edit'] } }
      ],
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/files/:id/metadata
router.patch('/:id/metadata', authMiddleware, async (req, res) => {
  const { name, tags } = req.body;

  try {
    const isLocker =
  file.lock?.user === req.user.username &&
  file.lock?.client === clientId;
    const file = await FileOrFolder.findById(req.params.id);

    if (file.lock?.user && !isLocker) {
  return res.status(423).json({ error: "File is locked by another user/client" });
}
    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    if (name) file.name = name;
    if (Array.isArray(tags)) file.tags = tags.slice(0, 5);
    file.modifiedAt = Date.now();

    await file.save();
    res.json({ message: 'Metadata updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Metadata update failed' });
  }
});

// GET /api/files
router.get('/', authMiddleware, async (req, res) => {
  const {
    sort = 'name',
    order = 'asc',
    parent = null,
    page = 1,
    limit = 10
  } = req.query;

  const sortOption = {};
  sortOption[sort] = order === 'asc' ? 1 : -1;

  const query = {
    parent,
    $or: [
      { owner: req.user.id },
      { [`permissions.${req.user.username}`]: { $in: ['view', 'edit'] } },
      { 'permissions.public': 'view' }
    ]
  };

  try {
    const total = await FileOrFolder.countDocuments(query);
    const files = await FileOrFolder.find(query)
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ files, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /folder/:id
router.get('/folder/:id', authMiddleware, async (req, res) => {
  const { sort = 'name', order = 'asc' } = req.query;
  const sortOption = {};
  sortOption[sort] = order === 'asc' ? 1 : -1;

  try {
    const parentFolder = await FileOrFolder.findById(req.params.id);
    if (!parentFolder || !hasPermission(parentFolder, req.user)) {
      return res.status(403).json({ message: 'Access denied to folder' });
    }

    const contents = await FileOrFolder.find({
      parent: req.params.id,
      $or: [
        { owner: req.user.id },
        { [`permissions.${req.user.username}`]: { $in: ['view', 'edit'] } },
        { 'permissions.public': 'view' }
      ]
    }).sort(sortOption);

    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/files/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || !hasPermission(file, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/files/create
router.post('/create', authMiddleware, async (req, res) => {
  const { name, type, content = '', tags = [], parent = null } = req.body;

  if (!name || !type) return res.status(400).json({ message: 'Missing required fields' });

  try {
    const newNode = new FileOrFolder({
      name,
      type,
      owner: req.user.id,
      parent,
      content: type === 'file' ? content : undefined,
      tags: type === 'file' ? tags.slice(0, 5) : [],
      size: type === 'file' ? Buffer.byteLength(content, 'utf8') : 0,
    });

    await newNode.save();
    res.status(201).json(newNode);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/files/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { content } = req.body;

  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file' || !hasPermission(file, req.user)) {
      return res.status(403).json({ message: 'Access denied or invalid file' });
    }

    file.content = content;
    file.modifiedAt = Date.now();
    file.size = Buffer.byteLength(content, 'utf8');

    await file.save();
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await FileOrFolder.findById(fileId);
    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleteRecursively = async (id) => {
      const children = await FileOrFolder.find({ parent: id });
      for (const child of children) await deleteRecursively(child._id);
      await FileOrFolder.findByIdAndDelete(id);
    };

    await deleteRecursively(fileId);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/files/:id/lock
router.put("/:id/lock", authMiddleware, async (req, res) => {
  const { clientId } = req.body;
  const username = req.user.username;

  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Check edit permission
    const hasEdit =
      file.owner.equals(req.user._id) ||
      file.permissions?.[username] === "edit";

    if (!hasEdit) {
      return res.status(403).json({ error: "No permission to lock this file" });
    }

    // Check if already locked by someone else
    if (file.lock?.user && (file.lock.user !== username || file.lock.client !== clientId)) {
      return res.status(423).json({ error: "File is already locked by another user/client" });
    }

    // Set lock
    file.lock = {
      user: username,
      client: clientId,
      createdAt: new Date()
    };

    await file.save();
    res.json({ message: "File locked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to lock file" });
  }
});

// PUT /api/files/:id/unlock

router.put("/:id/unlock", authMiddleware, async (req, res) => {
  const { clientId } = req.body;
  const username = req.user.username;

  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    const isLocker =
      file.lock?.user === username && file.lock?.client === clientId;

    if (!isLocker) {
      return res.status(403).json({ error: "You don't own this lock" });
    }

    file.lock = { user: null, client: null, createdAt: null };
    await file.save();
    res.json({ message: "File unlocked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to unlock file" });
  }
});
// File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const uploadedFile = new FileOrFolder({
      name: req.file.originalname,
      type: 'file',
      owner: req.user.id,
      parent: req.body.parent || null,
      size: req.file.size,
      uploadPath: req.file.filename,
    });
    await uploadedFile.save();
    res.status(201).json(uploadedFile);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Download route
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file' || !hasPermission(file, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../uploads', file.uploadPath);
    res.download(filePath, file.name);
  } catch (err) {
    res.status(500).json({ message: 'Download failed' });
  }
});

// Preview route
router.get('/:id/preview', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file' || !hasPermission(file, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.txt', '.md', '.json', '.js', '.html', '.css'];

    if (file.uploadPath) {
      if (!allowed.includes(ext)) return res.status(415).json({ message: 'Preview not supported' });
      const filePath = path.join(__dirname, '../uploads', file.uploadPath);
      const content = await fs.promises.readFile(filePath, 'utf8');
      return res.json({ content });
    }

    return res.json({ content: file.content || '' });

  } catch (err) {
    res.status(500).json({ message: 'Preview failed' });
  }
});

// Permissions
router.patch('/:id/permissions', authMiddleware, async (req, res) => {
  const { permissions } = req.body;
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can change permissions' });
    }
    if (node.name === "Recycle Bin" && node.parent === null) {
  return res.status(403).json({ error: "Cannot share the Recycle Bin folder" });
}

    file.permissions = permissions;
    await file.save();
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/unshare', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || !file.permissions?.[req.user.username]) {
      return res.status(404).json({ message: 'Not shared with you' });
    }

    delete file.permissions[req.user.username];
    await file.save();
    res.json({ message: 'Unshared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/shared', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const sharedFiles = await FileOrFolder.find({
      $or: [
        { 'permissions.viewers': userId },
        { 'permissions.editors': userId }
      ]
    });

    res.json({ files: sharedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching shared files' });
  }
});


module.exports = router;
