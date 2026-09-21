/**
 * WebRTC Signaling Handlers
 * Zero media passes through the server — strictly P2P mesh WebRTC.
 * Server only forwards SDP offers, answers, and ICE candidates between peers.
 */

import { roomStore } from '../memory/roomStore.js';

export function registerWebRTCHandlers(io, socket) {
  // WebRTC Offer
  socket.on('video:offer', ({ to, offer }) => {
    if (!to || !offer) return;
    io.to(to).emit('video:offer', {
      from: socket.id,
      offer
    });
  });

  // WebRTC Answer
  socket.on('video:answer', ({ to, answer }) => {
    if (!to || !answer) return;
    io.to(to).emit('video:answer', {
      from: socket.id,
      answer
    });
  });

  // WebRTC ICE Candidate
  socket.on('video:ice-candidate', ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(to).emit('video:ice-candidate', {
      from: socket.id,
      candidate
    });
  });

  // Peer signals its local media is ready and initialized
  socket.on('video:ready', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    socket.to(roomCode).emit('video:ready', { from: socket.id });
  });

  // Media toggle states (Mic, Camera, Screen Share, Video Filter)
  socket.on('video:media-state', (updates) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomStore.getRoom(roomCode);
    const participant = room?.participants.get(socket.id);

    // If joiner attempting to screen share but host disallowed it
    if (updates.isScreenSharing && room?.settings?.allowJoinerScreenShare === false && !participant?.isHost) {
      socket.emit('webrtc:error', { message: 'Host has disabled screen sharing for joiners.' });
      return;
    }

    const result = roomStore.updateParticipantMedia(socket.id, updates);
    if (result) {
      io.to(roomCode).emit('participant:media-updated', {
        socketId: socket.id,
        ...updates
      });
    }
  });
}
