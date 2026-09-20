/**
 * Pure in-memory IP rate limiter.
 * Zero database. Map is garbage collected automatically.
 */

const ipRequests = new Map();

// Periodic purge of old entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 60000);

export function rateLimiter({ max = 60, windowMs = 60000 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      ipRequests.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests! Thoda saans lo bhai, kalesh abhi baaki hai.'
      });
    }

    record.count++;
    next();
  };
}
