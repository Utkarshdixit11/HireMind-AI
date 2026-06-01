const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/signup
 * Directly creates the user account and returns a session token (no OTP verification).
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const emailLower = email.toLowerCase();

    // Prevent duplicate accounts
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    // Create user and mark as verified immediately
    const user = await User.create({
      name,
      email: emailLower,
      password,
      role: role || 'seeker',
      isVerified: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Failed to create account. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 * Standard local login. Validates credentials and logs the user in.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || user.provider === 'google') {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 * Retrieves the currently logged-in user profile.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Google OAuth redirect callback handler.
 */
const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user.toPublicJSON()))}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?error=google_auth_failed`);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  googleCallback,
  generateToken,
};
