const rateLimitStore = new Map();

/**
 * Simple in-memory rate limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.max - Maximum requests allowed per IP within the window (default: 5)
 * @param {string} options.message - Custom error message
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 5; // 5 requests
  const message = options.message || 'Too many verification requests. Please try again after a minute.';

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    let timestamps = rateLimitStore.get(ip);
    
    // Remove expired timestamps
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= max) {
      return res.status(429).json({ message });
    }

    timestamps.push(now);
    rateLimitStore.set(ip, timestamps);
    next();
  };
};

module.exports = { rateLimiter };
