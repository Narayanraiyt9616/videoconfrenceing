/**
 * Ephemeral Anonymous Poll Handlers
 * Zero persistence. Polls and votes vanish when the room is destroyed.
 */

import { roomStore } from '../memory/roomStore.js';

export function registerPollHandlers(io, socket) {
  // Create a new poll
  socket.on('poll:create', ({ question, options }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode || !question || !Array.isArray(options) || options.length < 2) return;

    const room = roomStore.getRoom(roomCode);
    const participant = room?.participants.get(socket.id);
    if (!participant) return;

    const poll = roomStore.createPoll(roomCode, {
      question,
      options,
      createdBy: participant.name
    });

    if (poll) {
      io.to(roomCode).emit('poll:created', poll);
    }
  });

  // Cast anonymous vote
  socket.on('poll:vote', ({ pollId, optionId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode || !pollId || !optionId) return;

    const updatedPoll = roomStore.votePoll(roomCode, pollId, optionId, socket.id);
    if (updatedPoll) {
      io.to(roomCode).emit('poll:updated', updatedPoll);
    }
  });
}
