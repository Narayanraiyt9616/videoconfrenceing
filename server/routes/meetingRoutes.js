import express from 'express';
import dbStore from '../db/store.js';
import { roomStore } from '../memory/roomStore.js';
import { generateRoomCode, normalizeRoomCode, isValidRoomCode } from '../utils/codeGenerator.js';
import { optionalAuth, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate Google Meet style meeting code: xxx-yyyy-zzz or KAL-1234
 */
function createFormattedCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const r = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${r(3)}-${r(4)}-${r(3)}`.toUpperCase();
}

/**
 * POST /api/meetings/instant
 * Create an instant meeting with MongoDB persistence and ephemeral WebRTC room
 * Restricted: Faculty & Admin only
 */
router.post('/instant', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Student accounts are not permitted to start live lectures.'
      });
    }

    const { title, isClassroom, courseCode } = req.body || {};
    const code = createFormattedCode();

    const hostId = req.user ? req.user._id || req.user.id : null;
    const hostName = req.user ? req.user.name : 'Faculty Host';
    const hostEmail = req.user ? req.user.email : '';

    // 1. Create in persistent database
    const meeting = await dbStore.createMeeting({
      meetingCode: code,
      title: title || (isClassroom ? `${courseCode || 'Class'}: Live Lecture` : 'Instant Video Meeting'),
      description: 'Instant meeting created via MeetHub',
      hostId,
      hostName,
      hostEmail,
      status: 'ongoing',
      scheduledStartTime: new Date().toISOString(),
      durationMinutes: 60,
      isClassroom: Boolean(isClassroom),
      courseCode: courseCode || '',
      settings: {
        allowJoinerChat: true,
        allowJoinerScreenShare: true,
        allowJoinerUnmute: true,
        isLocked: false,
        waitingRoomEnabled: false
      }
    });

    // 2. Also register in in-memory roomStore for active WebRTC signaling
    const { hostToken } = roomStore.createRoom({
      roomCode: code,
      roomName: meeting.title,
      maxParticipants: 50
    });

    res.status(201).json({
      success: true,
      meeting: {
        code: meeting.meetingCode,
        title: meeting.title,
        status: meeting.status,
        hostName: meeting.hostName,
        isClassroom: meeting.isClassroom,
        hostToken
      },
      message: 'Instant meeting ready!'
    });
  } catch (err) {
    console.error('[Instant Meeting Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/meetings/schedule
 * Schedule a meeting for a future date & time
 * Restricted: Faculty & Admin only
 */
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Student accounts are not permitted to schedule classes.'
      });
    }

    const {
      title,
      description,
      scheduledStartTime,
      durationMinutes = 60,
      passcode = '',
      isClassroom = false,
      courseCode = '',
      settings = {}
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Meeting title is required.' });
    }

    const code = createFormattedCode();
    const startTime = scheduledStartTime ? new Date(scheduledStartTime) : new Date(Date.now() + 3600000);

    const hostId = req.user ? req.user._id || req.user.id : null;
    const hostName = req.user ? req.user.name : 'Faculty Host';
    const hostEmail = req.user ? req.user.email : '';

    const meeting = await dbStore.createMeeting({
      meetingCode: code,
      title: title.trim(),
      description: description ? description.trim() : '',
      hostId,
      hostName,
      hostEmail,
      status: 'scheduled',
      scheduledStartTime: startTime.toISOString(),
      durationMinutes: parseInt(durationMinutes, 10) || 60,
      passcode: passcode.trim(),
      isClassroom: Boolean(isClassroom),
      courseCode: courseCode ? courseCode.trim() : '',
      settings: {
        allowJoinerChat: settings.allowJoinerChat !== false,
        allowJoinerScreenShare: settings.allowJoinerScreenShare !== false,
        allowJoinerUnmute: settings.allowJoinerUnmute !== false,
        isLocked: Boolean(settings.isLocked),
        waitingRoomEnabled: Boolean(settings.waitingRoomEnabled)
      }
    });

    res.status(201).json({
      success: true,
      meeting: {
        ...(typeof meeting.toObject === 'function' ? meeting.toObject() : meeting),
        code: meeting.meetingCode,
        meetingCode: meeting.meetingCode
      },
      message: 'Meeting scheduled successfully.'
    });
  } catch (err) {
    console.error('[Schedule Meeting Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/meetings/my
 * Get authenticated user's scheduled, ongoing, and past meetings
 */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const meetings = await dbStore.getUserMeetings(req.user._id || req.user.id, req.user.email);
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/meetings/:code
 * Validate meeting code before joining
 */
router.get('/:code', optionalAuth, async (req, res) => {
  try {
    const rawCode = req.params.code;
    const cleanCode = rawCode.toUpperCase().trim();

    // Check persistent database first
    let meeting = await dbStore.findMeetingByCode(cleanCode);

    // If not in database, check active roomStore (e.g. legacy room code)
    const memRoom = roomStore.getRoom(cleanCode);

    if (!meeting && !memRoom) {
      return res.status(404).json({
        success: false,
        exists: false,
        error: 'Meeting not found. Please verify the link or code.'
      });
    }

    if (meeting && meeting.status === 'ended') {
      return res.status(410).json({
        success: false,
        exists: true,
        ended: true,
        error: 'This meeting has already ended.'
      });
    }

    // Ensure active memory room exists for ongoing signaling
    if (!memRoom && meeting && meeting.status !== 'ended') {
      roomStore.createRoom({
        roomCode: cleanCode,
        roomName: meeting.title,
        maxParticipants: 50
      });
    }

    // Keep active
    roomStore.touch(cleanCode);

    const activeRoom = roomStore.getRoom(cleanCode);

    res.json({
      success: true,
      exists: true,
      meeting: {
        code: cleanCode,
        meetingCode: cleanCode,
        title: meeting ? meeting.title : activeRoom?.name || 'Live Meeting',
        description: meeting?.description || '',
        hostName: meeting?.hostName || 'Host',
        status: meeting?.status || 'ongoing',
        scheduledStartTime: meeting?.scheduledStartTime,
        durationMinutes: meeting?.durationMinutes,
        hasPasscode: Boolean(meeting?.passcode),
        isClassroom: Boolean(meeting?.isClassroom),
        courseCode: meeting?.courseCode || '',
        settings: meeting?.settings || activeRoom?.settings,
        participantsCount: activeRoom ? activeRoom.participants.size : 0,
        waitingRoomEnabled: Boolean(meeting?.settings?.waitingRoomEnabled)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/meetings/:code/end
 * End meeting for everyone
 * Restricted: Meeting Faculty Host or Admin only
 */
router.post('/:code/end', verifyToken, async (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    const meeting = await dbStore.findMeetingByCode(cleanCode);

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    const userId = (req.user._id || req.user.id)?.toString();
    const isOwner = (meeting.hostId && meeting.hostId.toString() === userId) || (meeting.hostEmail && meeting.hostEmail === req.user.email);
    const isAdmin = req.user.role === 'admin';
    const hostTokenHeader = req.headers['x-host-token'];
    const memRoom = roomStore.getRoom(cleanCode);
    const isTokenOwner = Boolean(hostTokenHeader && (hostTokenHeader === memRoom?.hostToken || hostTokenHeader === meeting.hostToken));

    if (!isOwner && !isAdmin && !isTokenOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only the faculty host or administrator can end this classroom session.'
      });
    }

    if (meeting) {
      await dbStore.updateMeeting(cleanCode, {
        status: 'ended',
        endedAt: new Date().toISOString()
      });
    }

    // Destroy active memory room
    roomStore.deleteRoom(cleanCode);

    res.json({
      success: true,
      message: 'Meeting ended for all participants.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/meetings/:code/attendance
 * Get real-time participant attendance records
 * Restricted: Faculty & Admin only
 */
router.get('/:code/attendance', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Attendance records are only accessible to faculty members and administrators.'
      });
    }

    const cleanCode = req.params.code.toUpperCase().trim();
    const records = await dbStore.getMeetingAttendance(cleanCode);
    res.json({ success: true, attendance: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/meetings/:code/attendance/export
 * Export attendance records as downloadable CSV
 */
router.get('/:code/attendance/export', async (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    const records = await dbStore.getMeetingAttendance(cleanCode);

    const headers = ['Participant Name', 'Email', 'Role', 'Joined At', 'Left At', 'Duration (Mins)', 'Status'];
    const rows = records.map((r) => [
      `"${r.participantName}"`,
      `"${r.participantEmail || 'N/A'}"`,
      `"${r.role}"`,
      `"${r.joinedAt}"`,
      `"${r.leftAt || 'Active'}"`,
      `"${r.durationMinutes || 0}"`,
      `"${r.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${cleanCode}.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/meetings/:code/calendar.ics
 * Export standard RFC 5545 iCalendar (.ics) format file
 */
router.get('/:code/calendar.ics', async (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    const meeting = await dbStore.findMeetingByCode(cleanCode);

    const title = meeting ? meeting.title : `MeetHub Meeting ${cleanCode}`;
    const desc = meeting?.description || 'Video Conference via MeetHub';
    const start = meeting?.scheduledStartTime ? new Date(meeting.scheduledStartTime) : new Date();
    const duration = meeting?.durationMinutes || 60;
    const end = new Date(start.getTime() + duration * 60000);

    const formatDate = (date) =>
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');

    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MeetHub//Video Conferencing//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${cleanCode}@meethub.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc} \\n\\nJoin meeting: http://localhost:5173/room/${cleanCode}`,
      `LOCATION:http://localhost:5173/room/${cleanCode}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="meeting-${cleanCode}.ics"`);
    res.status(200).send(icsString);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
