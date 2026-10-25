import express from 'express';
import dbStore from '../db/store.js';
import { optionalAuth, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/recordings
 * Get list of recordings (filtered by host if authenticated, or public list)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const hostId = req.user ? req.user._id || req.user.id : null;
    const recordings = await dbStore.getRecordings(hostId);
    res.json({ success: true, recordings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/recordings
 * Save metadata when a meeting recording finishes
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { meetingCode, title, durationSeconds, fileSize, fileUrl } = req.body;

    if (!meetingCode) {
      return res.status(400).json({ success: false, error: 'Meeting code is required.' });
    }

    const hostId = req.user ? req.user._id || req.user.id : null;
    const hostName = req.user ? req.user.name : 'Host';

    const recording = await dbStore.saveRecording({
      meetingCode,
      title: title || `Meeting Recording (${meetingCode})`,
      hostId,
      hostName,
      durationSeconds: parseInt(durationSeconds, 10) || 0,
      fileSize: parseInt(fileSize, 10) || 0,
      fileUrl: fileUrl || ''
    });

    res.status(201).json({
      success: true,
      recording,
      message: 'Recording saved successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
