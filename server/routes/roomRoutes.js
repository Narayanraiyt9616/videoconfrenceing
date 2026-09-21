import express from 'express';
import { roomStore } from '../memory/roomStore.js';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '../utils/codeGenerator.js';

const router = express.Router();

/**
 * GET /api/rooms/generate-code
 * Generate a fresh unique room code preview
 */
router.get('/generate-code', (req, res) => {
  const code = generateRoomCode();
  res.json({ success: true, roomCode: code });
});

/**
 * POST /api/rooms
 * Create a new ephemeral room (In-Memory ONLY)
 */
router.post('/', (req, res) => {
  const { roomName, maxParticipants, customRoomCode } = req.body || {};

  const roomCode = (customRoomCode && isValidRoomCode(customRoomCode))
    ? normalizeRoomCode(customRoomCode)
    : generateRoomCode();

  const { room, hostToken } = roomStore.createRoom({
    roomCode,
    roomName: roomName || 'Desi Kalesh Hangout 🔥',
    maxParticipants: maxParticipants || 10
  });

  res.status(201).json({
    success: true,
    roomCode: room.code,
    roomName: room.name,
    hostToken,
    maxParticipants: room.maxParticipants,
    message: 'Temporary room created! All data will be destroyed when everyone leaves.'
  });
});

/**
 * GET /api/rooms/:code
 * Validate room existence and capacity before joining
 */
router.get('/:code', (req, res) => {
  const code = normalizeRoomCode(req.params.code);

  if (!isValidRoomCode(code)) {
    return res.status(400).json({
      success: false,
      exists: false,
      error: 'Invalid room code format. Example: KAL-8X92'
    });
  }

  const room = roomStore.getRoom(code);
  if (!room) {
    return res.status(404).json({
      success: false,
      exists: false,
      error: 'Room not found or has already expired and destroyed.'
    });
  }

  // Keep room alive while participants are checking/joining
  roomStore.touch(code);

  res.json({
    success: true,
    exists: true,
    room: {
      code: room.code,
      name: room.name,
      participantsCount: room.participants.size,
      maxParticipants: room.maxParticipants,
      isFull: room.participants.size >= room.maxParticipants,
      createdAt: room.createdAt
    }
  });
});

/**
 * DELETE /api/rooms/:code
 * Host manual destruction of room
 */
router.delete('/:code', (req, res) => {
  const code = normalizeRoomCode(req.params.code);
  const hostToken = req.headers['x-host-token'];

  const room = roomStore.getRoom(code);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Room does not exist.' });
  }

  if (room.hostToken !== hostToken) {
    return res.status(403).json({ success: false, error: 'Unauthorized. Only the host can end this kalesh.' });
  }

  roomStore.deleteRoom(code);

  res.json({
    success: true,
    message: 'Kalesh officially ended. All temporary room data has been permanently destroyed.'
  });
});

export default router;
