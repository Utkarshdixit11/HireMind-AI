const express = require('express');
const passport = require('../config/passport');
const {
  signup,
  login,
  getMe,
  googleCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Define rate limiters for Auth abuse protection
const authLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many authentication attempts. Please try again after 5 minutes.'
});

// Local auth routes
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'seeker';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}?error=google_auth_failed`, session: false }),
  googleCallback
);

module.exports = router;
