const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ username: user.username, email: user.email });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Email not found' });

  // Generate token and send email logic here (skipped for now)
  res.json({ message: 'Reset link sent if email exists' });
});

// Update email
router.patch('/email', authMiddleware, async (req, res) => {
  const { email } = req.body;
  await User.findByIdAndUpdate(req.user.id, { email });
  res.json({ message: 'Email updated' });
});

// Update password
router.patch('/password', authMiddleware, async (req, res) => {
  const { password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(req.user.id, { password: hashed });
  res.json({ message: 'Password updated' });
});

// Delete account and cascade delete files
router.delete('/delete', authMiddleware, async (req, res) => {
  await FileOrFolder.deleteMany({ owner: req.user.id });
  await User.findByIdAndDelete(req.user.id);
  res.json({ message: 'Account deleted' });
});

const crypto = require('crypto');

const recoveryTokens = new Map();

router.post('/recover', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No user with that email' });

  const token = crypto.randomBytes(32).toString('hex');
  recoveryTokens.set(token, user._id.toString());

  const resetLink = `http://localhost:3000/reset/${token}`;
  console.log(`Password reset link for ${email}: ${resetLink}`);

  res.json({ message: 'Recovery link sent (simulated)' });
});

router.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const userId = recoveryTokens.get(token);
  if (!userId) return res.status(400).json({ message: 'Invalid or expired token' });

  const hashed = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(userId, { password: hashed });

  recoveryTokens.delete(token);
  res.json({ message: 'Password reset successful' });
});


module.exports = router;

