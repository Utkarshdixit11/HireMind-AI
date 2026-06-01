const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
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
            await user.save({ validateBeforeSave: false });
          }
          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Create new user from Google profile
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          provider: 'google',
          isVerified: true,
          role: 'seeker',
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
