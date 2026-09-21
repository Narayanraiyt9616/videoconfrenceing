/**
 * Pure In-Memory Ephemeral Room Store.
 * 
 * STRICT COMPLIANCE:
 * - Absolutely NO database used (No Mongo, SQL, Redis, Firebase, etc.)
 * - All rooms and sessions live in RAM inside Map() and Set() structures.
 * - When a room is deleted or server restarts, everything is gone permanently.
 */

import { v4 as uuidv4 } from 'uuid';

class RoomStore {
  constructor() {
    /** @type {Map<string, Object>} */
    this.rooms = new Map();

    /** @type {Map<string, string>} socketId -> roomCode reverse index for fast cleanup */
    this.socketToRoom = new Map();
  }

  /**
   * Create a new ephemeral room in memory
   */
  createRoom({ roomCode, roomName, maxParticipants = 10 }) {
    const hostToken = uuidv4();
    const now = Date.now();

    const room = {
      code: roomCode.toUpperCase(),
      name: roomName.trim() || 'Desi Kalesh Hangout 🔥',
      hostToken,
      hostSocketId: null,
      maxParticipants: Math.min(Math.max(parseInt(maxParticipants) || 10, 2), 20),
      participants: new Map(), // socketId -> participant data
      pendingKnocks: new Map(), // socketId -> knock data
      leaveRequests: new Map(), // socketId -> leave request data
      messages: [],
      polls: [],
      currentGame: null,
      createdAt: now,
      lastActivity: now,
      emptySince: now // Room starts empty until host/participant joins
    };

    this.rooms.set(room.code, room);
    return { room, hostToken };
  }

  _normalize(code) {
    if (!code || typeof code !== 'string') return '';
    let clean = code.trim().toUpperCase();
    if (/^KAL[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
      return `KAL-${clean.slice(3)}`;
    }
    if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
      return `KAL-${clean}`;
    }
    return clean;
  }

  getRoom(code) {
    if (!code) return null;
    const clean = this._normalize(code);
    return this.rooms.get(clean) || null;
  }

  hasRoom(code) {
    if (!code) return false;
    const clean = this._normalize(code);
    return this.rooms.has(clean);
  }

  touch(code) {
    const room = this.getRoom(code);
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  /**
   * Add participant to room
   */
  joinRoom(code, { socketId, name, avatar, isHost = false, hostToken = null }) {
    const room = this.getRoom(code);
    if (!room) {
      return { success: false, error: 'Room does not exist or has expired.' };
    }

    if (room.participants.size >= room.maxParticipants) {
      return { success: false, error: 'Kalesh is full! Max participant limit reached.' };
    }

    // Verify host token if claimed host
    const verifiedHost = isHost && hostToken && hostToken === room.hostToken;
    if (verifiedHost) {
      room.hostSocketId = socketId;
    }

    const participant = {
      id: socketId,
      name: (name || 'Kaleshi Friend').slice(0, 30),
      avatar: avatar || '🔥',
      isHost: verifiedHost || (room.participants.size === 0), // fallback host if first
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      joinedAt: Date.now()
    };

    if (participant.isHost && !room.hostSocketId) {
      room.hostSocketId = socketId;
    }

    room.participants.set(socketId, participant);
    this.socketToRoom.set(socketId, room.code);
    room.emptySince = null; // Clear empty status
    this.touch(code);

    return { success: true, room, participant };
  }

  /**
   * Update participant media state (mic/cam/screen)
   */
  updateParticipantMedia(socketId, updates) {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;
    const room = this.getRoom(code);
    if (!room) return null;

    const participant = room.participants.get(socketId);
    if (participant) {
      Object.assign(participant, updates);
      this.touch(code);
      return { room, participant };
    }
    return null;
  }

  /**
   * Remove a participant on disconnect / leave
   */
  leaveRoom(socketId) {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    this.socketToRoom.delete(socketId);
    const room = this.getRoom(code);
    if (!room) return null;

    const participant = room.participants.get(socketId);
    room.participants.delete(socketId);
    this.touch(code);

    // If room is now empty, mark emptySince instead of instant destruction so refreshes and invite links survive
    if (room.participants.size === 0) {
      room.emptySince = Date.now();
      return { roomCode: code, participant, roomDeleted: false, remaining: 0 };
    }

    // If the host left, assign host to the oldest participant
    let newHostId = null;
    if (room.hostSocketId === socketId) {
      const nextParticipant = room.participants.values().next().value;
      if (nextParticipant) {
        nextParticipant.isHost = true;
        room.hostSocketId = nextParticipant.id;
        newHostId = nextParticipant.id;
      }
    }

    return {
      roomCode: code,
      participant,
      roomDeleted: false,
      remaining: room.participants.size,
      newHostId,
      room
    };
  }

  /**
   * Complete destruction of room from memory
   */
  deleteRoom(code) {
    const normalizedCode = code.toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) return false;

    // Clean up reverse index for any remaining sockets
    for (const socketId of room.participants.keys()) {
      this.socketToRoom.delete(socketId);
    }

    // Explicitly nullify and clear all data arrays / maps
    room.participants.clear();
    room.pendingKnocks?.clear();
    room.leaveRequests?.clear();
    room.messages.length = 0;
    room.polls.length = 0;
    room.currentGame = null;

    // Remove from in-memory Map
    this.rooms.delete(normalizedCode);
    return true;
  }

  /**
   * Waiting Room (Door Knocking) & Leave Request Management
   */
  addJoinKnock(code, { socketId, name, avatar }) {
    const room = this.getRoom(code);
    if (!room) return null;
    const knock = { socketId, name, avatar, requestedAt: Date.now() };
    room.pendingKnocks.set(socketId, knock);
    return knock;
  }

  getPendingKnock(code, socketId) {
    const room = this.getRoom(code);
    return room?.pendingKnocks.get(socketId) || null;
  }

  removePendingKnock(code, socketId) {
    const room = this.getRoom(code);
    if (!room) return false;
    return room.pendingKnocks.delete(socketId);
  }

  addLeaveRequest(code, { socketId, name, avatar, reason }) {
    const room = this.getRoom(code);
    if (!room) return null;
    const req = { socketId, name, avatar, reason: reason || 'Bas ho gaya kalesh!', requestedAt: Date.now() };
    room.leaveRequests.set(socketId, req);
    return req;
  }

  removeLeaveRequest(code, socketId) {
    const room = this.getRoom(code);
    if (!room) return false;
    return room.leaveRequests.delete(socketId);
  }

  /**
   * Live chat management
   */
  addMessage(code, { senderId, senderName, senderAvatar, text, isSecret = false, replyTo = null, mediaUrl = null, mediaType = null }) {
    const room = this.getRoom(code);
    if (!room) return null;

    const message = {
      id: uuidv4(),
      senderId: isSecret ? null : senderId,
      senderName: isSecret ? 'Anonymous 👀' : senderName,
      senderAvatar: isSecret ? '🤫' : senderAvatar,
      text: text ? String(text).slice(0, 500) : '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null, // 'image' | 'gif' | 'video'
      isSecret,
      replyTo,
      reactions: {}, // emoji -> count
      timestamp: Date.now()
    };

    room.messages.push(message);
    // Keep in-memory buffer reasonable per ephemeral room
    if (room.messages.length > 200) {
      room.messages.shift();
    }

    this.touch(code);
    return message;
  }

  deleteMessage(code, messageId, socketId) {
    const room = this.getRoom(code);
    if (!room) return false;

    const index = room.messages.findIndex(m => m.id === messageId && (m.senderId === socketId || room.hostSocketId === socketId));
    if (index !== -1) {
      room.messages.splice(index, 1);
      this.touch(code);
      return true;
    }
    return false;
  }

  addMessageReaction(code, messageId, emoji, socketId) {
    const room = this.getRoom(code);
    if (!room) return null;

    const msg = room.messages.find(m => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }
    const list = msg.reactions[emoji];
    const idx = list.indexOf(socketId);
    if (idx > -1) {
      list.splice(idx, 1);
      if (list.length === 0) delete msg.reactions[emoji];
    } else {
      list.push(socketId);
    }

    this.touch(code);
    return msg;
  }

  /**
   * Anonymous Polls
   */
  createPoll(code, { question, options, createdBy }) {
    const room = this.getRoom(code);
    if (!room) return null;

    const poll = {
      id: uuidv4(),
      question: question.trim().slice(0, 150),
      options: options.map((opt, idx) => ({
        id: `opt-${idx}-${uuidv4().slice(0, 4)}`,
        text: String(opt).trim().slice(0, 80),
        voterIds: new Set()
      })),
      createdBy,
      createdAt: Date.now(),
      isActive: true
    };

    room.polls.unshift(poll);
    if (room.polls.length > 10) room.polls.pop();

    this.touch(code);
    return this.serializePoll(poll);
  }

  votePoll(code, pollId, optionId, socketId) {
    const room = this.getRoom(code);
    if (!room) return null;

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll || !poll.isActive) return null;

    // Check if user already voted in this poll, remove prior vote
    for (const opt of poll.options) {
      opt.voterIds.delete(socketId);
    }

    // Add new vote
    const selectedOption = poll.options.find(o => o.id === optionId);
    if (selectedOption) {
      selectedOption.voterIds.add(socketId);
    }

    this.touch(code);
    return this.serializePoll(poll);
  }

  serializePoll(poll) {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voterIds.size, 0);
    return {
      id: poll.id,
      question: poll.question,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt,
      isActive: poll.isActive,
      totalVotes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.voterIds.size,
        votesCount: opt.voterIds.size,
        voters: Array.from(opt.voterIds),
        percentage: totalVotes > 0 ? Math.round((opt.voterIds.size / totalVotes) * 100) : 0
      }))
    };
  }

  /**
   * Game Management
   */
  setGame(code, gameData) {
    const room = this.getRoom(code);
    if (!room) return null;

    room.currentGame = {
      ...gameData,
      updatedAt: Date.now()
    };
    this.touch(code);
    return room.currentGame;
  }

  getGame(code) {
    const room = this.getRoom(code);
    return room ? room.currentGame : null;
  }

  /**
   * Watchdog: Cleanup rooms inactive for > inactivityTimeoutMs or empty for > emptyGraceMs
   */
  cleanupInactiveRooms(inactivityTimeoutMs = 3600000, emptyGraceMs = 1800000) {
    const now = Date.now();
    const expiredCodes = [];

    for (const [code, room] of this.rooms.entries()) {
      const isExpiredInactivity = (now - room.lastActivity > inactivityTimeoutMs);
      const isExpiredEmpty = room.emptySince && (now - room.emptySince > emptyGraceMs);

      if (isExpiredInactivity || isExpiredEmpty) {
        expiredCodes.push(code);
      }
    }

    for (const code of expiredCodes) {
      this.deleteRoom(code);
    }

    return expiredCodes;
  }

  /**
   * Get safe serializable room representation for client
   */
  toClientRoom(code) {
    const room = this.getRoom(code);
    if (!room) return null;

    return {
      code: room.code,
      name: room.name,
      hostSocketId: room.hostSocketId,
      maxParticipants: room.maxParticipants,
      participantsCount: room.participants.size,
      participants: Array.from(room.participants.values()),
      pendingKnocks: Array.from(room.pendingKnocks?.values() || []),
      leaveRequests: Array.from(room.leaveRequests?.values() || []),
      messagesCount: room.messages.length,
      pollsCount: room.polls.length,
      polls: room.polls.map(p => this.serializePoll(p)),
      currentGame: room.currentGame,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    };
  }

  getStats() {
    return {
      activeRooms: this.rooms.size,
      totalParticipants: this.socketToRoom.size
    };
  }
}

export const roomStore = new RoomStore();
