const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User'); 
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const mimeTypes = {
  txt: 'text/plain',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown',
};




const FileOrFolder = require('../models/FileOrFolder');
const authMiddleware = require("../middleware/authMiddleware");



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
const canEdit = node.permissions?.[req.user.username] === 'edit';
    // Can't delete others' stuff
    if (!isOwner && !canUnshare) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
if (!isOwner && !canEdit) {
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




router.post('/:id/generate-link', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner = file.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only the owner can generate links' });

    // Generate a unique token if one doesn't exist
    if (!file.publicLinkId) {
      file.publicLinkId = crypto.randomBytes(16).toString('hex');
      await file.save();
    }

    const shareableUrl = `http://localhost:5000/api/files/public/${file.publicLinkId}`;
    res.json({ link: shareableUrl });
  } catch (err) {
    console.error('[LINK ERROR]', err);
    res.status(500).json({ error: 'Failed to generate link' });
  }
});


router.get('/public/:id', async (req, res) => {
  try {
    const file = await FileOrFolder.findOne({ publicLinkId: req.params.id });

    if (!file || !file.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../uploads', file.uploadPath);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[PUBLIC LINK ERROR]', err);
    return res.status(500).json({ error: 'Failed to access file' });
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
router.patch('/:id/metadata', authMiddleware, async (req, res) => {
  const { name, tags, isPublic, clientId } = req.body;

  try {
    const file = await FileOrFolder.findById(req.params.id); 

    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const isLocker =
      file.lock?.user === req.user.username &&
      file.lock?.client === clientId;

    if (file.lock?.user && !isLocker) {
      return res.status(423).json({ error: "File is locked by another user/client" });
    }

    if (name) file.name = name;
    if (Array.isArray(tags)) file.tags = tags.slice(0, 5);
    if (typeof isPublic === 'boolean') file.isPublic = isPublic;

    file.modifiedAt = Date.now();
    await file.save();

    res.json({ message: 'Metadata updated successfully' });

  } catch (err) {
    console.error('[ERROR] PATCH /metadata:', err);
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

router.get('/public', async (req, res) => {
  try {
    const publicFiles = await FileOrFolder.find({ isPublic: true });
    res.json({ files: publicFiles });
  } catch (err) {
    console.error('[GET /public] Error:', err);
    res.status(500).json({ message: 'Failed to fetch public files' });
  }
});

// GET /folder/:id
router.get('/folder/:id', authMiddleware, async (req, res) => {
  const { sort = 'name', order = 'asc' } = req.query;
  const sortOption = {};
  sortOption[sort] = order === 'asc' ? 1 : -1;

  try {
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

// POST /api/files/createconst path = require('path');

router.post('/create', authMiddleware, async (req, res) => {
  const { name, type, content = '', tags = [], parent = null } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  console.log('[CREATE]', { name, type, parent, user: req.user.username });

  try {
    const newNode = new FileOrFolder({
      name,
      type,
      owner: req.user.id,
      parent: parent || null,
      content: type === 'file' ? content : undefined,
      tags: type === 'file' ? tags.slice(0, 5) : [],
      size: type === 'file' ? Buffer.byteLength(content, 'utf8') : 0,
    });

    await newNode.save();
    res.status(201).json(newNode);
  } catch (err) {
    console.error('[CREATE ERROR]', err);
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
router.delete("/:id", authMiddleware, async (req, res) => {
  console.log('[DELETE ENTRY] HIT route with ID:', req.params.id);

  try {
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const fileOwner = node.owner?.toString();
    const reqUserId = req.user.id; // ✅ correct field

    console.log('[DELETE DEBUG]', {
      fileId: node._id,
      fileOwner,
      reqUserId,
      match: fileOwner === reqUserId
    });

    if (fileOwner !== reqUserId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await node.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error('[DELETE ERROR]', err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// PATCH /api/files/:id - Edit file content, tags, or name
router.patch('/:id', authMiddleware, async (req, res) => {
  const { content, tags, name } = req.body;

  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file') {
      return res.status(404).json({ error: 'File not found or not editable' });
    }

    // Only the owner can edit
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Apply updates
    if (content !== undefined) {
      file.content = content;
      file.size = Buffer.byteLength(content, 'utf8');
      file.modifiedAt = new Date();
    }
    if (Array.isArray(tags)) {
      file.tags = tags.slice(0, 5);
    }
    if (name) {
      file.name = name;
    }

    await file.save();
    res.status(200).json({ message: 'File updated successfully', file });
  } catch (err) {
    console.error('[EDIT FILE ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const file = await FileOrFolder.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner = file.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only owner can edit' });

    file.content = content;
    file.modifiedAt = new Date();
    await file.save();

    res.json({ message: 'Saved' });
  } catch (err) {
    console.error('[EDIT ERROR]', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.patch('/:id/edit', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (file.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { content, tags, name } = req.body;
    file.content = content || file.content;
    file.tags = tags || file.tags;
    file.name = name || file.name;
    file.modifiedAt = new Date();

    await file.save();
    res.json({ message: 'File updated' });
  } catch (err) {
    console.error('[EDIT FILE ERROR]', err);
    res.status(500).json({ error: 'Failed to edit file' });
  }
});



router.patch('/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const { isPublic, permissions } = req.body;
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Only owner can change public status or permissions
    if (file.owner.toString() !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    if (typeof isPublic === 'boolean') {
      file.isPublic = isPublic;
      file.publicLinkId = isPublic ? (file.publicLinkId || uuidv4()) : null;
    }

    if (permissions) {
      file.permissions = new Map(Object.entries(permissions));
    }

    await file.save();
    res.json({ success: true, publicLinkId: file.publicLinkId });
  } catch (err) {
    console.error('[PERMISSION ERROR]', err);
    res.status(500).json({ error: 'Server error while updating permissions' });
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


router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const { parent } = req.body;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const newFile = new FileOrFolder({
    name: req.file.originalname,
    type: 'file',
    content: '', // Optionally read content
    owner: req.user.id,
    nameOnDisk: req.file.filename,
    parent: parent || null,
    size: req.file.size,
    uploadPath: req.file.path
  });

  await newFile.save();
  res.status(201).json(newFile);
});




// Download Route
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');

    // Text-based files stored in MongoDB
    if (file.content !== undefined && file.content !== null) {
      const extension = file.name.split('.').pop();
      const mimeType = mimeTypes[extension] || 'text/plain';
      const buffer = Buffer.from(file.content, 'utf-8');

      res.set({
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': mimeType,
      });

      return res.send(buffer);
    }

    // File uploaded to disk (e.g., PDFs, Excel files, etc.)
    if (!file.nameOnDisk) {
      return res.status(400).send('No file uploaded for this entry');
    }

    const filePath = path.join(__dirname, '..', 'uploads', file.nameOnDisk);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on disk');
    }

    // Use original name from DB
    res.download(filePath, file.name);
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    res.status(500).send('Download failed');
  }
});


// GET public file by link ID
router.get('/public/:publicLinkId', async (req, res) => {
  try {
    const file = await FileOrFolder.findOne({ publicLinkId: req.params.publicLinkId });

    if (!file || file.type !== 'file') {
      return res.status(404).json({ error: 'File not found or not a valid file' });
    }

    if (!file.uploadPath) {
      console.error('[UPLOAD PATH ERROR] File is missing uploadPath:', file);
      return res.status(500).json({ error: 'File upload path missing' });
    }

    const filePath = path.join(__dirname, '..', file.uploadPath);
    console.log('[PUBLIC FILE DOWNLOAD]', filePath);

    return res.sendFile(filePath);
  } catch (err) {
    console.error('[PUBLIC LINK ERROR]', err);
    return res.status(500).json({ error: 'Failed to access file' });
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
  const { isPublic } = req.body;
  const fileId = req.params.id;

  try {
    const file = await FileOrFolder.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized to update permissions' });
    }

    if (typeof isPublic !== 'undefined') {
      file.isPublic = isPublic;

      if (isPublic && !file.publicLinkId) {
        file.publicLinkId = uuidv4();
      } else if (!isPublic) {
        file.publicLinkId = null;
      }
    }

    await file.save();
    return res.json({ success: true, file });
  } catch (err) {
    console.error('[PERMISSION UPDATE ERROR]', err);
    return res.status(500).json({ error: 'Failed to update permissions' });
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
