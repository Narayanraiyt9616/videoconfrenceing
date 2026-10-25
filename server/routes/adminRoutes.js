import express from 'express';
import dbStore from '../db/store.js';
import { roomStore } from '../memory/roomStore.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Protect all admin routes
router.use(verifyToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/stats
 * Platform overview statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const users = await dbStore.getAllUsers();
    const meetings = await dbStore.getAllMeetings();
    const activeRoomsCount = roomStore.rooms.size;

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status !== 'disabled').length,
      roles: {
        admin: users.filter((u) => u.role === 'admin').length,
        faculty: users.filter((u) => u.role === 'faculty').length,
        student: users.filter((u) => u.role === 'student').length,
        user: users.filter((u) => u.role === 'user').length
      },
      totalMeetings: meetings.length,
      scheduledMeetings: meetings.filter((m) => m.status === 'scheduled').length,
      ongoingMeetings: activeRoomsCount,
      completedMeetings: meetings.filter((m) => m.status === 'ended').length,
      classroomCount: meetings.filter((m) => m.isClassroom).length
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/users
 * List all registered users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await dbStore.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user role or status (active/disabled)
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { role, status } = req.body;
    const updates = {};
    if (role && ['user', 'faculty', 'student', 'admin'].includes(role)) {
      updates.role = role;
    }
    if (status && ['active', 'disabled'].includes(status)) {
      updates.status = status;
    }

    const updated = await dbStore.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, user: updated, message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/meetings
 * List all platform meetings
 */
router.get('/meetings', async (req, res) => {
  try {
    const meetings = await dbStore.getAllMeetings();
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
