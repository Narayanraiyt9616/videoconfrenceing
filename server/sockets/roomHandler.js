/**
 * Ephemeral Room Lifecycle & Host Control Handlers
 */

import { roomStore } from '../memory/roomStore.js';

export function registerRoomHandlers(io, socket) {
  // Join temporary room
  socket.on('room:join', ({ roomCode, name, avatar, isHost = false, hostToken = null }, callback) => {
    const code = roomCode?.toUpperCase();
    if (!code) {
      return callback?.({ success: false, error: 'Room code is required' });
    }

    const result = roomStore.joinRoom(code, {
      socketId: socket.id,
      name,
      avatar,
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

    console.log(`[Kalesh Room] ${currentParticipant.name} (${socket.id}) joined room ${code}`);
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
    const code = roomCode?.toUpperCase();
    if (!code) {
      return callback?.({ success: false, error: 'Room code is required' });
    }

    const room = roomStore.getRoom(code);
    if (!room) {
      return callback?.({ success: false, error: 'Room not found or has expired! 💀' });
    }

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

  // Host officially ends room
  socket.on('room:end', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;

    console.log(`[Kalesh Room] Host officially ended room ${roomCode}. Destroying all data!`);

    // Broadcast room destruction to all participants
    io.to(roomCode).emit('room:ended', {
      reason: 'Kalesh officially ended by host. All room data has been destroyed.'
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

  if (roomDeleted) {
    console.log(`[Kalesh Room] All participants left. Room ${roomCode} destroyed from memory.`);
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
