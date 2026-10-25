import jwt from 'jsonwebtoken';
import dbStore from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'meethub-jwt-super-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

export async function verifyToken(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbStore.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account deactivated.'
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please sign in again.'
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await dbStore.findUserById(decoded.id);
      if (user && user.status !== 'disabled') {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue without req.user for guests
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Sign in required.' });
    }

    if (req.user.role === 'admin') {
      return next(); // Admins have master access
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. This action requires role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}
