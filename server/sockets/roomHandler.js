/**
 * Ephemeral Room Lifecycle & Host Control Handlers
 */

import { roomStore } from '../memory/roomStore.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import dbStore from '../db/store.js';

export function registerRoomHandlers(io, socket) {
  // Join temporary room
  socket.on('room:join', ({ roomCode, name, avatar, email, role, isHost = false, hostToken = null }, callback) => {
    const code = normalizeRoomCode(roomCode);
    if (!code) {
      return callback?.({ success: false, error: 'Room code is required' });
    }

    const result = roomStore.joinRoom(code, {
      socketId: socket.id,
      name,
      avatar,
      email,
      role: role || (isHost ? 'faculty' : 'user'),
      isHost,
      hostToken
    });

    if (!result.success) {
      return callback?.(result);
    }

    // Join Socket.IO room channel
    socket.join(code);

    const room = result.room;
    const currentParticipant = result.participant;

    // Record attendance for online classroom & meeting tracking
    dbStore.recordAttendance({
      meetingCode: code,
      courseCode: room.courseCode || '',
      participantName: currentParticipant.name,
      participantEmail: email || '',
      role: currentParticipant.role || (isHost ? 'faculty' : 'student')
    }).catch(() => {});

    // Notify the joining client of current room state
    const roomState = roomStore.toClientRoom(code);
    callback?.({
      success: true,
      participant: currentParticipant,
      room: roomState
    });

    // Notify other peers in room that a new participant joined
    socket.to(code).emit('participant:joined', {
      participant: currentParticipant
    });

    console.log(`[Meeting Room] ${currentParticipant.name} (${socket.id}) joined room ${code}`);
  });

  // Explicit leave
  socket.on('room:leave', () => {
    handleParticipantLeave(io, socket);
  });

  // Host mute another participant
  socket.on('host:mute', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return; // Only host can mute

    io.to(targetSocketId).emit('host:force-mute');
    io.to(roomCode).emit('participant:media-updated', {
      socketId: targetSocketId,
      isMuted: true
    });
  });

  // Host remove participant
  socket.on('host:remove', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return; // Only host can remove

    io.to(targetSocketId).emit('host:removed', {
      reason: 'Host removed you from the kalesh.'
    });

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.leave(roomCode);
      handleParticipantLeave(io, targetSocket);
    }
  });

  // Door Knocking: Peer requests to join room
  socket.on('room:knock', ({ roomCode, name, avatar }, callback) => {
    const code = normalizeRoomCode(roomCode);
    if (!code) {
      return callback?.({ success: false, error: 'Room code is required' });
    }

    const room = roomStore.getRoom(code);
    if (!room) {
      return callback?.({ success: false, error: 'Room not found or has expired! 💀' });
    }

    if (room.settings?.isLocked) {
      return callback?.({ success: false, error: 'Room is locked by the host! Knocking is disabled.' });
    }

    // Touch room to keep alive while waiting for host response
    roomStore.touch(code);

    if (room.participants.size >= room.maxParticipants) {
      return callback?.({ success: false, error: 'Room is full! Max limit reached.' });
    }

    // If no host is currently connected, allow directly
    if (!room.hostSocketId || room.participants.size === 0) {
      return callback?.({ success: true, status: 'approved_direct' });
    }

    const knock = roomStore.addJoinKnock(code, {
      socketId: socket.id,
      name: name || 'Kaleshi Friend',
      avatar: avatar || '🔥'
    });

    // Notify Host in room
    io.to(room.hostSocketId).emit('host:knock-received', knock);

    callback?.({
      success: true,
      status: 'waiting_approval',
      message: 'Knocking on the door... Waiting for host approval 🔥'
    });
  });

  // Host approves knocking participant
  socket.on('host:approve-knock', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    roomStore.removePendingKnock(roomCode, targetSocketId);
    io.to(targetSocketId).emit('room:knock-approved', { roomCode });
    io.to(socket.id).emit('host:pending-knocks-updated', Array.from(room.pendingKnocks.values()));
  });

  // Host rejects knocking participant
  socket.on('host:reject-knock', ({ targetSocketId, reason }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    roomStore.removePendingKnock(roomCode, targetSocketId);
    io.to(targetSocketId).emit('room:knock-rejected', {
      reason: reason || 'Host ne entry reject kar di! Kalesh private hai 💀'
    });
    io.to(socket.id).emit('host:pending-knocks-updated', Array.from(room.pendingKnocks.values()));
  });

  // Leave Permission: Non-host requests permission to leave
  socket.on('room:request-leave', ({ reason } = {}, callback) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return callback?.({ success: false });
    const room = roomStore.getRoom(roomCode);
    if (!room) return callback?.({ success: false });

    const participant = room.participants.get(socket.id);
    if (!participant) return callback?.({ success: false });

    // If user is already the host, they don't need permission from anyone
    if (participant.isHost) {
      return callback?.({ success: true, status: 'host_direct' });
    }

    const req = roomStore.addLeaveRequest(roomCode, {
      socketId: socket.id,
      name: participant.name,
      avatar: participant.avatar,
      reason: reason || 'Bas ho gaya kalesh!'
    });

    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('host:leave-requested', req);
    }

    callback?.({
      success: true,
      status: 'waiting_permission',
      message: 'Host se leave permission maangi gayi hai...'
    });
  });

  // Host approves participant leave
  socket.on('host:approve-leave', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    roomStore.removeLeaveRequest(roomCode, targetSocketId);
    io.to(targetSocketId).emit('room:leave-approved');
    io.to(socket.id).emit('host:leave-requests-updated', Array.from(room.leaveRequests.values()));
  });

  // Host rejects participant leave
  socket.on('host:reject-leave', ({ targetSocketId, customMessage }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    roomStore.removeLeaveRequest(roomCode, targetSocketId);
    io.to(targetSocketId).emit('room:leave-rejected', {
      message: customMessage || 'Host ne jaane se mana kar diya! Abhi pura kalesh dekhna padega! 😂🔥'
    });
    io.to(socket.id).emit('host:leave-requests-updated', Array.from(room.leaveRequests.values()));
  });

  // Host update room settings (permissions, lock state)
  socket.on('host:update-settings', ({ settings }, callback) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return callback?.({ success: false });
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) {
      return callback?.({ success: false, error: 'Unauthorized: Only host can update room settings' });
    }

    const updatedSettings = roomStore.updateSettings(roomCode, settings);
    io.to(roomCode).emit('room:settings-updated', { settings: updatedSettings });
    callback?.({ success: true, settings: updatedSettings });
  });

  // Host mute all participants except host
  socket.on('host:mute-all', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    for (const [pId, p] of room.participants.entries()) {
      if (pId !== socket.id) {
        p.isMuted = true;
        io.to(pId).emit('host:force-mute');
        io.to(roomCode).emit('participant:media-updated', {
          socketId: pId,
          isMuted: true
        });
      }
    }
  });

  // Host turn off camera for all participants except host
  socket.on('host:camera-off-all', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    for (const [pId, p] of room.participants.entries()) {
      if (pId !== socket.id) {
        p.isCameraOff = true;
        io.to(pId).emit('host:force-camera-off');
        io.to(roomCode).emit('participant:media-updated', {
          socketId: pId,
          isCameraOff: true
        });
      }
    }
  });

  // Host force turn off camera for specific participant
  socket.on('host:force-camera-off', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    const target = room.participants.get(targetSocketId);
    if (target) {
      target.isCameraOff = true;
      io.to(targetSocketId).emit('host:force-camera-off');
      io.to(roomCode).emit('participant:media-updated', {
        socketId: targetSocketId,
        isCameraOff: true
      });
    }
  });

  // Host transfer role to another participant
  socket.on('host:transfer-role', ({ targetSocketId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    const newHost = roomStore.transferHost(roomCode, targetSocketId);
    if (newHost) {
      io.to(roomCode).emit('room:host-transferred', {
        previousHostId: socket.id,
        newHostId: targetSocketId,
        newHostName: newHost.name
      });
      io.to(roomCode).emit('participants:updated', Array.from(room.participants.values()));
    }
  });

  // Soundboard: Trigger a sound effect across room
  socket.on('soundboard:play', ({ soundId, soundName, soundEmoji, soundUrl, isCustom = false }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room) return;

    const participant = room.participants.get(socket.id);
    if (!participant) return;

    // Check if host disabled soundboard for joiners
    if (!room.settings?.allowJoinerSoundboard && !participant.isHost) {
      return socket.emit('soundboard:error', { message: 'Host has disabled soundboard for joiners!' });
    }

    io.to(roomCode).emit('soundboard:played', {
      soundId,
      soundName,
      soundEmoji: soundEmoji || '🔊',
      soundUrl: soundUrl || null,
      isCustom,
      playedBy: {
        id: socket.id,
        name: participant.name,
        avatar: participant.avatar
      },
      timestamp: Date.now()
    });
  });

  // Soundboard: Upload custom sound effect to ephemeral room memory
  socket.on('soundboard:upload', ({ name, emoji, audioData }, callback) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return callback?.({ success: false, error: 'Room not found' });
    const room = roomStore.getRoom(roomCode);
    if (!room) return callback?.({ success: false, error: 'Room not found' });

    const participant = room.participants.get(socket.id);
    if (!participant) return callback?.({ success: false, error: 'Participant not found' });

    if (!room.settings?.allowJoinerSoundboard && !participant.isHost) {
      return callback?.({ success: false, error: 'Host has disabled soundboard for joiners!' });
    }

    if (!audioData || typeof audioData !== 'string') {
      return callback?.({ success: false, error: 'Audio data is required' });
    }

    // Limit base64 audio payload to ~3.5MB to protect RAM
    if (audioData.length > 3500000) {
      return callback?.({ success: false, error: 'Audio file too large! Maximum 2.5MB allowed.' });
    }

    const sound = roomStore.addCustomSound(roomCode, {
      name,
      emoji,
      audioData,
      uploadedBy: {
        id: socket.id,
        name: participant.name,
        avatar: participant.avatar
      }
    });

    if (sound) {
      io.to(roomCode).emit('soundboard:custom-sound-added', sound);
      callback?.({ success: true, sound });
    } else {
      callback?.({ success: false, error: 'Failed to upload custom sound' });
    }
  });

  // Soundboard: Delete custom sound effect
  socket.on('soundboard:delete', ({ soundId }, callback) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return callback?.({ success: false });
    const room = roomStore.getRoom(roomCode);
    if (!room) return callback?.({ success: false });

    const participant = room.participants.get(socket.id);
    const sound = room.customSounds?.find((s) => s.id === soundId);
    if (!sound) return callback?.({ success: false, error: 'Sound not found' });

    const canDelete = participant?.isHost || sound.uploadedBy?.id === socket.id;
    if (!canDelete) {
      return callback?.({ success: false, error: 'Only host or the uploader can delete this sound.' });
    }

    const deleted = roomStore.deleteCustomSound(roomCode, soundId);
    if (deleted) {
      io.to(roomCode).emit('soundboard:custom-sound-removed', { soundId });
      callback?.({ success: true });
    } else {
      callback?.({ success: false });
    }
  });

  // Hand Raise events
  socket.on('hand:raise', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    const participant = room?.participants.get(socket.id);
    if (participant) {
      participant.hasHandRaised = true;
      participant.handRaisedAt = Date.now();
      io.to(roomCode).emit('hand:raised', {
        socketId: socket.id,
        participantName: participant.name,
        participantAvatar: participant.avatar,
        handRaisedAt: participant.handRaisedAt
      });
    }
  });

  socket.on('hand:lower', ({ targetSocketId } = {}) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    const idToLower = targetSocketId || socket.id;
    const participant = room?.participants.get(idToLower);
    if (participant) {
      participant.hasHandRaised = false;
      io.to(roomCode).emit('hand:lowered', {
        socketId: idToLower,
        participantName: participant.name
      });
    }
  });

  socket.on('hand:lower-all', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    for (const p of room.participants.values()) {
      p.hasHandRaised = false;
    }
    io.to(roomCode).emit('hand:all-lowered');
  });

  // Live Captions Transcript Broadcast
  socket.on('captions:transcript', ({ text, isFinal }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    const participant = room?.participants.get(socket.id);
    if (participant && text) {
      socket.to(roomCode).emit('captions:received', {
        senderId: socket.id,
        senderName: participant.name,
        senderAvatar: participant.avatar,
        text,
        isFinal: Boolean(isFinal),
        timestamp: Date.now()
      });
    }
  });

  // Recording Status Broadcast
  socket.on('recording:status', ({ isRecording, recordingDuration = 0 }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    io.to(roomCode).emit('recording:status-changed', {
      isRecording: Boolean(isRecording),
      recordingDuration
    });
  });

  // Host officially ends room
  socket.on('room:end', async () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    console.log(`[Meeting Room] Host officially ended room ${roomCode}.`);

    // Update persistent meeting status in database
    dbStore.updateMeeting(roomCode, { status: 'ended', endedAt: new Date().toISOString() }).catch(() => {});

    // Broadcast room destruction to all participants
    io.to(roomCode).emit('room:ended', {
      reason: 'Meeting officially ended by the host.'
    });

    // Disconnect all sockets from room
    io.in(roomCode).socketsLeave(roomCode);

    // Completely erase room from memory
    roomStore.deleteRoom(roomCode);
  });
}

export function handleParticipantLeave(io, socket) {
  const result = roomStore.leaveRoom(socket.id);
  if (!result) return;

  const { roomCode, participant, roomDeleted, remaining, newHostId } = result;

  // Mark attendance leave in database
  if (participant?.name) {
    dbStore.markAttendanceLeave(roomCode, participant.name).catch(() => {});
  }

  if (roomDeleted) {
    console.log(`[Meeting Room] All participants left. Room ${roomCode} destroyed from memory.`);
  } else {
    // Notify remaining participants
    io.to(roomCode).emit('participant:left', {
      socketId: socket.id,
      participantName: participant?.name,
      remainingCount: remaining,
      newHostId
    });
  }
}
