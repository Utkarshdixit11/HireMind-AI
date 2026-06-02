const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        // Check if user already exists with this email
        let user = await User.findOne({ email });

        if (user) {
          // Link Google account if not linked yet
          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = 'google';
            user.isVerified = true;
            if (profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
          }
          user.lastLogin = new Date();

          // Determine role from state and update user's role dynamically
          if (req.query && req.query.state) {
            try {
              const stateObj = JSON.parse(req.query.state);
              if (stateObj && stateObj.role) {
                user.role = stateObj.role;
              }
            } catch (e) {
              if (req.query.state === 'provider' || req.query.state === 'seeker') {
                user.role = req.query.state;
              }
            }
          }

          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Determine role from state
        let role = 'seeker';
        if (req.query && req.query.state) {
          try {
            const stateObj = JSON.parse(req.query.state);
            if (stateObj && stateObj.role) {
              role = stateObj.role;
            }
          } catch (e) {
            if (req.query.state === 'provider' || req.query.state === 'seeker') {
              role = req.query.state;
            }
          }
        }

        // Create new user from Google profile
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          provider: 'google',
          isVerified: true,
          role,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
