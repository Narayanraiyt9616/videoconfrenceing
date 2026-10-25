import express from 'express';
import bcrypt from 'bcryptjs';
import dbStore from '../db/store.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with secure password hashing and JWT
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', avatar = '👨‍💻', department = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const existing = await dbStore.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    const validRole = ['user', 'faculty', 'student', 'admin'].includes(role) ? role : 'user';

    const user = await dbStore.createUser({
      name,
      email,
      password,
      role: validRole,
      avatar,
      department
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      },
      message: 'Registration successful! Welcome to MeetHub.'
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ success: false, error: 'Registration failed. ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with bcrypt verification and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const user = await dbStore.findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'Account has been disabled. Please contact an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      },
      message: 'Signed in successfully.'
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ success: false, error: 'Login failed. ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const meetings = await dbStore.getUserMeetings(user._id || user.id, user.email);

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        status: user.status,
        createdAt: user.createdAt
      },
      stats: {
        totalMeetings: meetings.length,
        scheduledMeetings: meetings.filter((m) => m.status === 'scheduled').length,
        completedMeetings: meetings.filter((m) => m.status === 'ended').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/profile
 * Update user display name, avatar, department
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, avatar, department, role } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;
    if (department !== undefined) updates.department = department.trim();
    // Allow users to switch between student/faculty for testing education features
    if (role && ['user', 'faculty', 'student'].includes(role) && req.user.role !== 'admin') {
      updates.role = role;
    }

    const updated = await dbStore.updateUser(req.user._id || req.user.id, updates);

    res.json({
      success: true,
      user: {
        id: updated._id || updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
        department: updated.department
      },
      message: 'Profile updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/change-password
 * Change password after validating old password
 */
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Provide both current and new password.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const userWithPassword = await dbStore.findUserByEmail(req.user.email, true);
    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await dbStore.updateUser(req.user._id || req.user.id, { password: hashed });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/history
 * Fetch meeting history for authenticated user
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const meetings = await dbStore.getUserMeetings(user._id || user.id, user.email);
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
