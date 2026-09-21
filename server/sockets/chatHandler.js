/**
 * Live Ephemeral Chat Handlers
 * ZERO database. Messages only exist in server RAM during active room session.
 */

import { roomStore } from '../memory/roomStore.js';

export function registerChatHandlers(io, socket) {
  // Send live message (regular or secret anonymous, text or media image/gif)
  socket.on('chat:send', ({ text = '', isSecret = false, replyTo = null, mediaUrl = null, mediaType = null }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room) return;

    const participant = room.participants.get(socket.id);
    if (!participant) return;

    // Enforce host chat moderation setting
    if (room.settings && !room.settings.allowJoinerChat && !participant.isHost) {
      socket.emit('chat:error', { message: 'Host has paused chat for joiners.' });
      return;
    }

    const message = roomStore.addMessage(roomCode, {
      senderId: socket.id,
      senderName: participant.name,
      senderAvatar: participant.avatar,
      text,
      mediaUrl,
      mediaType,
      isSecret,
      replyTo
    });

    if (message) {
      io.to(roomCode).emit('chat:message', message);
    }
  });

  // Delete own message or host can delete any
  socket.on('chat:delete', ({ messageId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const success = roomStore.deleteMessage(roomCode, messageId, socket.id);
    if (success) {
      io.to(roomCode).emit('chat:deleted', { messageId });
    }
  });

  // Toggle emoji reaction on message
  socket.on('chat:react', ({ messageId, emoji }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const updatedMessage = roomStore.addMessageReaction(roomCode, messageId, emoji, socket.id);
    if (updatedMessage) {
      io.to(roomCode).emit('chat:reaction-updated', {
        messageId,
        reactions: updatedMessage.reactions
      });
    }
  });

  // Real-time typing indicators
  socket.on('chat:typing', ({ isTyping }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    const participant = room?.participants.get(socket.id);

    if (participant) {
      socket.to(roomCode).emit('chat:user-typing', {
        userId: socket.id,
        userName: participant.name,
        isTyping: Boolean(isTyping)
      });
    }
  });
}
