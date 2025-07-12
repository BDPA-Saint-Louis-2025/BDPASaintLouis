const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");

const FileOrFolder = require('../models/FileOrFolder');
const authMiddleware = require("../middleware/authMiddleware");

// ✅ GET /api/files/myfiles – Root level files for user
router.get('/myfiles', authMiddleware, async (req, res) => {
  try {
    const files = await FileOrFolder.find({ owner: req.user.id, parent: null });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', authMiddleware, async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ message: 'Missing search query' });

  try {
    const results = await FileOrFolder.find({
      owner: req.user.id,
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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await FileOrFolder.find({ owner: req.user.id, parent: null });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/files/folder/:id – Files within a folder
router.get('/folder/:id', authMiddleware, async (req, res) => {
  try {
    const contents = await FileOrFolder.find({ owner: req.user.id, parent: req.params.id });
    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/files/:id – Retrieve a single file (used for editor)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/files/create – Create file or folder
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

// ✅ PUT /api/files/:id – Update file content
router.put('/:id', authMiddleware, async (req, res) => {
  const { content } = req.body;
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file') return res.status(404).json({ message: 'File not found or not a file' });
    if (file.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    file.content = content;
    file.modifiedAt = Date.now();
    file.size = Buffer.byteLength(content, 'utf8');

    await file.save();
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/files/:id – Delete file/folder recursively
router.delete('/:id', authMiddleware, async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await FileOrFolder.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const deleteRecursively = async (id) => {
      const children = await FileOrFolder.find({ parent: id });
      for (const child of children) {
        await deleteRecursively(child._id);
      }
      await FileOrFolder.findByIdAndDelete(id);
    };

    await deleteRecursively(fileId);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/files/:id/lock
router.patch('/:id/lock', authMiddleware, async (req, res) => {
  const { client } = req.body;
  const username = req.user.username;

  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const isLockedByAnother =
      file.lock.user &&
      file.lock.client &&
      (file.lock.user !== username || file.lock.client !== client);

    if (isLockedByAnother) {
      return res.status(403).json({ message: 'File is locked by another session' });
    }

    file.lock = {
      user: username,
      client,
      createdAt: Date.now(),
    };
    await file.save();
    res.json({ message: 'Lock acquired' });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
