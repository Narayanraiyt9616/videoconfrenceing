/**
 * Central Socket.IO Initializer
 */

import { registerRoomHandlers, handleParticipantLeave } from './roomHandler.js';
import { registerWebRTCHandlers } from './webrtcHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerPollHandlers } from './pollHandler.js';
import { registerGameHandlers } from './gameHandler.js';

export function initializeSockets(io) {
  io.on('connection', (socket) => {
    // Register domain handlers
    registerRoomHandlers(io, socket);
    registerWebRTCHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerPollHandlers(io, socket);
    registerGameHandlers(io, socket);

    // Handle unexpected disconnection
    socket.on('disconnect', () => {
      handleParticipantLeave(io, socket);
    });
  });
}
