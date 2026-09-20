/**
 * Interactive Kalesh Games & Activity Socket Handlers
 * Zero database. All prompts, votes, and game states live in ephemeral memory.
 */

import { roomStore } from '../memory/roomStore.js';
import { AAJ_KA_TOPICS, WHOS_MOST_LIKELY_QUESTIONS, TRUTH_PROMPTS, DARE_PROMPTS } from '../utils/topicsData.js';
import { getRandomRoast } from '../utils/roastsData.js';
import { v4 as uuidv4 } from 'uuid';

export function registerGameHandlers(io, socket) {
  // 1. Aaj Ka Topic (Random Flip Card)
  socket.on('topic:random', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const randomIndex = Math.floor(Math.random() * AAJ_KA_TOPICS.length);
    const topic = AAJ_KA_TOPICS[randomIndex];

    const gameData = roomStore.setGame(roomCode, {
      type: 'topic',
      topic,
      generatedAt: Date.now()
    });

    io.to(roomCode).emit('topic:updated', { topic, gameData });
  });

  // 2. Who's Most Likely?
  socket.on('whos_most_likely:start', ({ customQuestion } = {}) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room) return;

    const question = customQuestion || WHOS_MOST_LIKELY_QUESTIONS[Math.floor(Math.random() * WHOS_MOST_LIKELY_QUESTIONS.length)];
    const participantsList = Array.from(room.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar
    }));

    const gameData = {
      type: 'whos_most_likely',
      id: uuidv4(),
      question,
      participants: participantsList,
      votes: {}, // voterSocketId -> targetSocketId
      status: 'voting', // 'voting' | 'counting' | 'revealed'
      startedAt: Date.now()
    };

    roomStore.setGame(roomCode, gameData);
    io.to(roomCode).emit('whos_most_likely:started', gameData);
  });

  socket.on('whos_most_likely:vote', ({ targetId }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode || !targetId) return;

    const currentGame = roomStore.getGame(roomCode);
    if (!currentGame || currentGame.type !== 'whos_most_likely' || currentGame.status !== 'voting') return;

    currentGame.votes[socket.id] = targetId;

    const room = roomStore.getRoom(roomCode);
    const totalParticipants = room?.participants.size || 1;
    const votesCount = Object.keys(currentGame.votes).length;

    io.to(roomCode).emit('whos_most_likely:vote_update', {
      votesCount,
      totalParticipants
    });

    // If everyone has voted, automatically reveal
    if (votesCount >= totalParticipants) {
      revealWhosMostLikely(io, roomCode, currentGame);
    }
  });

  socket.on('whos_most_likely:reveal', () => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const currentGame = roomStore.getGame(roomCode);
    if (!currentGame || currentGame.type !== 'whos_most_likely') return;

    revealWhosMostLikely(io, roomCode, currentGame);
  });

  // 3. Truth or Dare
  socket.on('truth_or_dare:draw', ({ type = 'truth', targetParticipantId = null }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room) return;

    const prompts = type === 'dare' ? DARE_PROMPTS : TRUTH_PROMPTS;
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    let target = null;
    if (targetParticipantId && room.participants.has(targetParticipantId)) {
      const p = room.participants.get(targetParticipantId);
      target = { id: p.id, name: p.name, avatar: p.avatar };
    } else {
      // Pick random participant
      const allParticipants = Array.from(room.participants.values());
      const randomP = allParticipants[Math.floor(Math.random() * allParticipants.length)];
      if (randomP) {
        target = { id: randomP.id, name: randomP.name, avatar: randomP.avatar };
      }
    }

    const gameData = roomStore.setGame(roomCode, {
      type: 'truth_or_dare',
      mode: type,
      prompt,
      target,
      drawnAt: Date.now()
    });

    io.to(roomCode).emit('truth_or_dare:prompt', gameData);
  });

  // 4. Roast Mode
  socket.on('roast:generate', ({ targetParticipantId, level = 'mild' }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomStore.getRoom(roomCode);
    if (!room) return;

    const sender = room.participants.get(socket.id);
    const target = room.participants.get(targetParticipantId) || sender;

    const targetName = target?.name || 'Kaleshi Friend';
    const roastText = getRandomRoast(targetName, level);

    const roastPayload = {
      id: uuidv4(),
      targetId: target?.id,
      targetName,
      targetAvatar: target?.avatar,
      senderName: sender?.name || 'Unknown',
      level,
      roastText,
      timestamp: Date.now()
    };

    io.to(roomCode).emit('roast:generated', roastPayload);
  });

  // 5. Floating Screen Reactions
  socket.on('reaction:send', ({ emoji }) => {
    const roomCode = roomStore.socketToRoom.get(socket.id);
    if (!roomCode || !emoji) return;

    const room = roomStore.getRoom(roomCode);
    const sender = room?.participants.get(socket.id);

    io.to(roomCode).emit('reaction:received', {
      id: uuidv4(),
      emoji,
      fromName: sender?.name || '',
      timestamp: Date.now()
    });
  });
}

function revealWhosMostLikely(io, roomCode, game) {
  game.status = 'revealed';

  // Tally votes
  const tallies = {};
  for (const targetId of Object.values(game.votes)) {
    tallies[targetId] = (tallies[targetId] || 0) + 1;
  }

  let winnerId = null;
  let maxVotes = 0;
  for (const [id, count] of Object.entries(tallies)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = id;
    }
  }

  const room = roomStore.getRoom(roomCode);
  const winner = winnerId && room?.participants.get(winnerId) ? {
    id: winnerId,
    name: room.participants.get(winnerId).name,
    avatar: room.participants.get(winnerId).avatar
  } : null;

  io.to(roomCode).emit('whos_most_likely:result', {
    gameId: game.id,
    question: game.question,
    winner,
    maxVotes,
    tallies,
    totalVotes: Object.keys(game.votes).length
  });
}
