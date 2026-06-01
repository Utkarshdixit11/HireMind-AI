const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH update profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const allowedFields = ['name', 'bio', 'skills', 'role', 'companyName', 'companyDescription', 'avatar'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated.', user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH change password
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    if (user.provider === 'google') {
      return res.status(400).json({ message: 'Google accounts cannot change password.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
