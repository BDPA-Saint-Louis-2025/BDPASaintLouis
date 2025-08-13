// routes/files.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const mime = require('mime-types');

const FileOrFolder = require('../models/FileOrFolder');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// ---------- Helpers ----------
const userIdOf = (req) => (req.user?.id || req.user?._id || '').toString();
const usernameOf = (req) => (req.user?.username || '').toString();

const asPlainPerms = (perms) => {
  if (!perms) return {};
  // Mongoose Map -> plain object
  if (perms instanceof Map) {
    const out = {};
    for (const [k, v] of perms.entries()) out[k] = v;
    return out;
  }
  return perms; // already plain object / Mixed
};

const setPerm = (file, username, level) => {
  if (!file.permissions) {
    // prefer Map if schema says Map, else use object
    if (file.schema?.path('permissions')?.instance === 'Map') {
      file.permissions = new Map();
    } else {
      file.permissions = {};
    }
  }
  if (file.permissions instanceof Map) {
    file.permissions.set(username, level);
  } else {
    file.permissions[username] = level;
    if (typeof file.markModified === 'function') file.markModified('permissions');
  }
};

const deletePerm = (file, username) => {
  if (!file.permissions) return;
  if (file.permissions instanceof Map) {
    file.permissions.delete(username);
  } else {
    delete file.permissions[username];
    if (typeof file.markModified === 'function') file.markModified('permissions');
  }
};

const getPermLevel = (file, username) => {
  if (!file.permissions) return undefined;
  if (file.permissions instanceof Map) return file.permissions.get(username);
  return file.permissions[username];
};

const hasPermission = (file, reqUser) => {
  const me = userIdOf({ user: reqUser });
  const myName = reqUser.username;
  if (file.owner?.toString() === me) return true;
  const lvl = getPermLevel(file, myName);
  if (lvl === 'view' || lvl === 'edit') return true;
  // support legacy public flag
  if (asPlainPerms(file.permissions)?.public === 'view' || file.isPublic) return true;
  return false;
};

async function ensureRecycleBin(userId) {
  let bin = await FileOrFolder.findOne({ owner: userId, name: 'Recycle Bin', type: 'folder' });
  if (!bin) {
    bin = new FileOrFolder({ name: 'Recycle Bin', type: 'folder', owner: userId, isPublic: false });
    await bin.save();
  }
  return bin;
}

async function deleteRecursively(fileId) {
  const item = await FileOrFolder.findById(fileId);
  if (!item) return;
  if (item.type === 'folder') {
    const children = await FileOrFolder.find({ parent: item._id });
    for (const child of children) await deleteRecursively(child._id);
  }
  await FileOrFolder.deleteOne({ _id: item._id });
}
// ---------- Upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// =====================================================
// ROUTES — put specific ones BEFORE any "/:id" routes!
// =====================================================

// SHARED WITH ME
router.get('/shared', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const myName = usernameOf(req);

    const q = {
      $and: [
        { owner: { $ne: me } },
        {
          $or: [
            { [`permissions.${myName}`]: { $in: ['view', 'edit'] } }, // map/object by username
            { 'permissions.viewers': { $in: [me, myName] } },         // legacy array forms
            { 'permissions.editors': { $in: [me, myName] } }
          ]
        }
      ]
    };

    const items = await FileOrFolder.find(q);
    res.json(items);
  } catch (err) {
    console.error('[SHARED ERROR]', err);
    res.status(500).json({ message: 'Error fetching shared items' });
  }
});

// MY FILES (root)
router.get('/myfiles', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const myName = usernameOf(req);
    // root only (parent:null). includes owned + shared-at-root if your UI wants them.
    const query = {
      parent: null,
      $or: [
        { owner: me },
        { [`permissions.${myName}`]: { $in: ['view', 'edit'] } },
        { 'permissions.public': 'view' },
        { isPublic: true }
      ]
    };
    const files = await FileOrFolder.find(query);
    res.json(files);
  } catch (err) {
    console.error('[MYFILES ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// SEARCH (in scope of accessible items)
router.get('/search', authMiddleware, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Missing search query' });

  try {
    const me = userIdOf(req);
    const myName = usernameOf(req);
    const results = await FileOrFolder.find({
      $and: [
        {
          $or: [
            { owner: me },
            { [`permissions.${myName}`]: { $in: ['view', 'edit'] } },
            { 'permissions.public': 'view' },
            { isPublic: true }
          ]
        },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    });
    res.json(results);
  } catch (err) {
    console.error('[SEARCH ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LIST BY FOLDER
router.get('/folder/:id', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const myName = usernameOf(req);
    const { sort = 'name', order = 'asc' } = req.query;
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    const contents = await FileOrFolder.find({
      parent: req.params.id,
      $or: [
        { owner: me },
        { [`permissions.${myName}`]: { $in: ['view', 'edit'] } },
        { 'permissions.public': 'view' },
        { isPublic: true }
      ]
    }).sort(sortOption);

    res.json(contents);
  } catch (err) {
    console.error('[FOLDER LIST ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE (file or folder)
router.post('/create', authMiddleware, async (req, res) => {
  const { name, type, content = '', tags = [], parent = null } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Missing required fields' });

  try {
    const me = userIdOf(req);
    const newNode = new FileOrFolder({
      name,
      type,
      owner: me,
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

// UPLOAD
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { parent } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const me = userIdOf(req);
    const newFile = new FileOrFolder({
      name: req.file.originalname,
      type: 'file',
      owner: me,
      nameOnDisk: path.basename(req.file.path),
      parent: parent || null,
      size: req.file.size,
      uploadPath: req.file.path, // stored absolute; download handlers are aware
      mimeType: mime.lookup(req.file.originalname) || 'application/octet-stream'
    });

    await newFile.save();
    res.status(201).json(newFile);
  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// DOWNLOAD
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || !hasPermission(file, req.user)) return res.status(403).send('Access denied');

    if (file.nameOnDisk) {
      const filePath = path.join(__dirname, '..', 'uploads', file.nameOnDisk);
      if (!fs.existsSync(filePath)) return res.status(404).send('File not found on disk');
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name || 'download.txt'}"`);
    return res.send(file.content || '');
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    res.status(500).send('Download failed');
  }
});

// GENERATE PUBLIC LINK
router.post('/:id/generate-link', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.owner?.toString() !== me) return res.status(403).json({ error: 'Only the owner can generate links' });

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


router.get('/public', async (req, res)=>{
  try{
    const files = await FileOrFolder.find({isPublic:true});
    res.json({files})

  }catch(err){
    console.error("Failed cuz you suck");
    res.status(500).json({message: "Failed"})
  }


})
// PUBLIC BY LINK (binary)
router.get('/public/:publicLinkId', async (req, res) => {
  try {
    const file = await FileOrFolder.findOne({ publicLinkId: req.params.publicLinkId });
    if (!file || file.type !== 'file' || !file.isPublic) return res.status(404).json({ error: 'Not available' });

    const filePath = file.uploadPath
      ? file.uploadPath
      : path.join(__dirname, '..', 'uploads', file.nameOnDisk || '');
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[PUBLIC LINK ERROR]', err);
    return res.status(500).json({ error: 'Failed to access file' });
  }
});

// PREVIEW (text-like)
router.get('/:id/preview', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file' || !hasPermission(file, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowed = ['.txt', '.md', '.json', '.js', '.html', '.css'];
    const ext = path.extname(file.name || '').toLowerCase();

    if (file.uploadPath) {
      if (!allowed.includes(ext)) return res.status(415).json({ message: 'Preview not supported' });
      const filePath = file.uploadPath;
      const content = await fs.promises.readFile(filePath, 'utf8');
      return res.json({ content });
    }

    return res.json({ content: file.content || '' });
  } catch (err) {
    console.error('[PREVIEW ERROR]', err);
    res.status(500).json({ message: 'Preview failed' });
  }
});

// UPDATE METADATA (owner only)
router.patch('/:id/metadata', authMiddleware, async (req, res) => {
  const { name, tags, isPublic, clientId } = req.body;
  try {
    const me = userIdOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.owner?.toString() !== me) return res.status(404).json({ message: 'File not found or access denied' });

    if (name) file.name = name;
    if (Array.isArray(tags)) file.tags = tags.slice(0, 5);
    if (typeof isPublic === 'boolean') {
      file.isPublic = isPublic;
      if (isPublic && !file.publicLinkId) file.publicLinkId = uuidv4();
      if (!isPublic) file.publicLinkId = null;
    }
    file.modifiedAt = Date.now();
    await file.save();
    res.json({ message: 'Metadata updated successfully' });
  } catch (err) {
    console.error('[PATCH /metadata ERROR]', err);
    res.status(500).json({ message: 'Metadata update failed' });
  }
});

// EDIT FILE CONTENT / NAME / TAGS (owner only)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.type !== 'file' || file.owner?.toString() !== me) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { content, tags, name } = req.body;
    if (content !== undefined) {
      file.content = content;
      file.size = Buffer.byteLength(content, 'utf8');
      file.modifiedAt = new Date();
    }
    if (Array.isArray(tags)) file.tags = tags.slice(0, 5);
    if (name) file.name = name;

    await file.save();
    res.status(200).json({ message: 'File updated successfully', file });
  } catch (err) {
    console.error('[EDIT FILE ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE TAGS
router.patch('/:id/tags', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || file.owner?.toString() !== me) return res.status(404).send('File not found or not owner');

    const { tags } = req.body;
    file.tags = Array.isArray(tags) ? tags : [];
    await file.save();
    res.status(200).json({ message: 'Tags updated', tags: file.tags });
  } catch (err) {
    console.error('[TAG UPDATE ERROR]', err);
    res.status(500).send('Failed to update tags');
  }
});

// SHARE / PUBLIC — unified (owner only)
router.patch('/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const { isPublic, targetEmail, targetUsername, accessType } = req.body;
    const me = userIdOf(req);

    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.owner?.toString() !== me) return res.status(403).json({ error: 'Unauthorized' });

    if (typeof isPublic === 'boolean') {
      file.isPublic = isPublic;
      file.publicLinkId = isPublic ? (file.publicLinkId || uuidv4()) : null;
    }

    if (targetEmail || targetUsername) {
      const user = await User.findOne(
        targetEmail ? { email: targetEmail.toLowerCase() } : { username: targetUsername }
      );
      if (!user) return res.status(404).json({ error: 'Target user not found' });

      const level = accessType === 'edit' ? 'edit' : 'view';
      setPerm(file, user.username, level);
    }

    await file.save();
    res.json({
      success: true,
      isPublic: file.isPublic,
      publicLinkId: file.publicLinkId,
      permissions: asPlainPerms(file.permissions)
    });
  } catch (err) {
    console.error('[PERMISSIONS ERROR]', err);
    res.status(500).json({ error: 'Server error while updating permissions' });
  }
});

// UNSHARE (recipient removes themselves)
router.delete('/:id/unshare', authMiddleware, async (req, res) => {
  try {
    const myName = usernameOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || !getPermLevel(file, myName)) return res.status(404).json({ message: 'Not shared with you' });

    deletePerm(file, myName);
    await file.save();
    res.json({ message: 'Unshared' });
  } catch (err) {
    console.error('[UNSHARE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// SOFT DELETE (to Recycle Bin) — owner or editor
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const file = await FileOrFolder.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File or folder not found' });

    const isOwner = file.owner?.toString() === me;
    const canEdit = getPermLevel(file, usernameOf(req)) === 'edit';
    if (!isOwner && !canEdit) return res.status(403).json({ error: 'Not authorized' });

    // If item is already in Recycle Bin for this owner → hard delete
    const recycleBin = await FileOrFolder.findOne({ name: 'Recycle Bin', parent: null, owner: file.owner });
    const isInRecycleBin = recycleBin && file.parent?.toString() === recycleBin._id.toString();

    if (isInRecycleBin) {
      await deleteRecursively(file._id);
      return res.status(200).json({ message: 'Permanently deleted from Recycle Bin' });
    }

    // else move to bin
    const bin = recycleBin || await ensureRecycleBin(file.owner);
    file.parent = bin._id;
    await file.save();
    res.status(200).json({ message: 'Moved to Recycle Bin' });
  } catch (err) {
    console.error('[DELETE ROUTE ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HARD DELETE (owner only)
router.delete('/:id/hard', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    if (node.owner?.toString() !== me) return res.status(403).json({ error: 'Unauthorized' });
    await FileOrFolder.deleteOne({ _id: node._id });
    res.json({ message: 'Node permanently deleted' });
  } catch (err) {
    console.error('[HARD DELETE ERROR]', err);
    res.status(500).json({ error: 'Error during hard delete' });
  }
});

// RESTORE from Recycle Bin (owner only)
router.put('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const me = userIdOf(req);
    const node = await FileOrFolder.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    if (node.owner?.toString() !== me) return res.status(403).json({ error: 'Unauthorized' });

    node.parent = null;
    await node.save();
    res.json({ message: 'Restored from Recycle Bin' });
  } catch (err) {
    console.error('[RESTORE ERROR]', err);
    res.status(500).json({ error: 'Error restoring file' });
  }
});

// GET BY ID (read)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await FileOrFolder.findById(req.params.id);
    if (!file || !hasPermission(file, req.user)) return res.status(403).json({ message: 'Access denied' });
    res.json(file);
  } catch (err) {
    console.error('[GET BY ID ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
