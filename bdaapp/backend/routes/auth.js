const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require('../middleware/auth');
const verifyToken = require("../middleware/auth");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();



// SEND RESET EMAIL
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('[RESET EMAIL ERROR]', err);
    res.status(500).json({ error: 'Error sending reset email' });
  }
});


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user with that email' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,       // example@gmail.com
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      html: `<p>Click below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent' });

  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});


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
router.patch("/email", verifyToken, async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true }
    );

    res.json({ message: "Email updated successfully", email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
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



router.post('/recover', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If a matching account exists, a reset link will be sent.' });


    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 10; // 10 minutes

    user.resetToken = resetToken;
    user.resetTokenExpires = expires;
    await user.save();
    console.log(`[DEBUG] Password reset link: http://localhost:3000/reset-password/${resetToken}`);

    return res.json({ message: 'Recovery link generated (check console)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Error resetting password' });
  }
});


router.patch('/username', authMiddleware, async (req, res) => {
  try {
    console.log('PATCH /username → req.user:', req.user);
    console.log('PATCH /username → req.body:', req.body);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = req.body.username;
    await user.save();

    return res.json({ message: 'Username updated' });
  } catch (err) {
    console.error('PATCH /username error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

