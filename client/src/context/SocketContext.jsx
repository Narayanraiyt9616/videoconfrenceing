import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { soundFx } from '../utils/soundFx.js';
import { normalizeRoomCode } from '../utils/roomUtils.js';

const SocketContext = createContext(null);

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  'https://videoconfrenceing.onrender.com'
).replace(/\/$/, '');

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [recentRoast, setRecentRoast] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [pendingKnocks, setPendingKnocks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Initialize Socket connection
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to Kalesh Server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    // Participant lifecycle events
    socket.on('participant:joined', ({ participant: newPeer }) => {
      soundFx.playJoin();
      toast.success(`${newPeer.name} aa gaya kalesh mein! ${newPeer.avatar}`, {
        icon: '🔥',
        style: { background: '#11141e', color: '#fff', border: '1px solid rgba(255,75,31,0.3)' }
      });
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.id !== newPeer.id);
        return [...filtered, newPeer];
      });
    });

    socket.on('participant:left', ({ socketId, participantName, remainingCount, newHostId }) => {
      soundFx.playLeave();
      if (participantName) {
        toast(`${participantName} bhaag gaya room se! 🏃`, {
          icon: '💀',
          style: { background: '#11141e', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
        });
      }
      setParticipants((prev) => prev.filter((p) => p.id !== socketId));
      if (newHostId) {
        setParticipants((prev) =>
          prev.map((p) => (p.id === newHostId ? { ...p, isHost: true } : p))
        );
        setParticipant((curr) => (curr?.id === newHostId ? { ...curr, isHost: true } : curr));
      }
    });

    socket.on('participant:media-updated', ({ socketId, ...updates }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === socketId ? { ...p, ...updates } : p))
      );
      setParticipant((curr) => (curr?.id === socketId ? { ...curr, ...updates } : curr));
    });

    // Host force actions
    socket.on('host:force-mute', () => {
      toast('Host ne tumhe mute kar diya! 🤫', {
        icon: '🔇',
        style: { background: '#11141e', color: '#ffca28' }
      });
      setParticipant((curr) => (curr ? { ...curr, isMuted: true } : curr));
    });

    socket.on('host:removed', ({ reason }) => {
      toast.error(reason || 'Host ne tumhe kalesh se nikaal diya 💀', { duration: 5000 });
      resetSession();
    });

    socket.on('room:ended', ({ reason }) => {
      soundFx.playLeave();
      toast.error(reason || 'Kalesh officially khatam! All data destroyed. 💀', { duration: 6000 });
      resetSession();
    });

    // Chat events
    socket.on('chat:message', (message) => {
      soundFx.playMessage();
      setMessages((prev) => [...prev, message]);
    });

    socket.on('chat:deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on('chat:reaction-updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    socket.on('chat:user-typing', ({ userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
          return prev;
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
      });
    });

    // Polls
    socket.on('poll:created', (poll) => {
      soundFx.playPop();
      toast('Naya anonymous poll shuru hua! 🗳️', {
        style: { background: '#11141e', color: '#00f2fe' }
      });
      setPolls((prev) => [poll, ...prev]);
    });

    socket.on('poll:updated', (updatedPoll) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p))
      );
    });

    // Games
    socket.on('topic:updated', ({ topic, gameData }) => {
      soundFx.playPop();
      setCurrentGame({ type: 'topic', topic });
    });

    socket.on('whos_most_likely:started', (gameData) => {
      soundFx.playPop();
      setCurrentGame(gameData);
    });

    socket.on('whos_most_likely:vote_update', ({ votesCount, totalParticipants }) => {
      setCurrentGame((curr) => (curr ? { ...curr, votesCount, totalParticipants } : curr));
    });

    socket.on('whos_most_likely:result', (resultData) => {
      soundFx.playFanfare();
      setCurrentGame((curr) => ({ ...curr, ...resultData, status: 'revealed' }));
    });

    socket.on('truth_or_dare:prompt', (gameData) => {
      soundFx.playPop();
      setCurrentGame(gameData);
    });

    socket.on('roast:generated', (roast) => {
      soundFx.playPop();
      setRecentRoast(roast);
    });

    // Floating reaction animation event
    socket.on('reaction:received', (reaction) => {
      soundFx.playPop();
      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 4000);
    });

    // Host Waiting Room: Door knocking & Leave request listeners
    socket.on('host:knock-received', (knock) => {
      soundFx.playPop();
      toast(`${knock.name} darwaze pe knock kar raha hai! 🚪`, {
        icon: '🔔',
        duration: 6000,
        style: { background: '#11141e', color: '#00f2fe', border: '1px solid rgba(0,242,254,0.3)' }
      });
      setPendingKnocks((prev) => {
        const filtered = prev.filter((k) => k.socketId !== knock.socketId);
        return [...filtered, knock];
      });
    });

    socket.on('host:pending-knocks-updated', (knocks) => {
      setPendingKnocks(knocks || []);
    });

    socket.on('host:leave-requested', (req) => {
      soundFx.playPop();
      toast(`${req.name} kalesh chhodne ki permission maang raha hai! 🏃`, {
        icon: '🔒',
        duration: 6000,
        style: { background: '#11141e', color: '#ffca28', border: '1px solid rgba(255,202,40,0.3)' }
      });
      setLeaveRequests((prev) => {
        const filtered = prev.filter((l) => l.socketId !== req.socketId);
        return [...filtered, req];
      });
    });

    socket.on('host:leave-requests-updated', (requests) => {
      setLeaveRequests(requests || []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const resetSession = useCallback(() => {
    setRoom(null);
    setParticipant(null);
    setParticipants([]);
    setMessages([]);
    setPolls([]);
    setCurrentGame(null);
    setRecentRoast(null);
    setPendingKnocks([]);
    setLeaveRequests([]);
  }, []);

  // REST: Generate New Code Preview
  const generateNewCode = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/generate-code`);
      const data = await res.json();
      return data.roomCode;
    } catch {
      // Fallback local code generation if offline
      return 'KAL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
  };

  // REST: Create Room
  const createRoom = async ({ roomName, maxParticipants, customRoomCode = null }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, maxParticipants, customRoomCode })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    } catch (err) {
      toast.error(err.message || 'Room creation failed');
      throw err;
    }
  };

  // REST: Validate Room
  const checkRoom = async (code) => {
    const cleanCode = normalizeRoomCode(code);
    if (!cleanCode) {
      return { success: false, exists: false, error: 'Please enter a room code.' };
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${cleanCode}`);
      if (res.status === 404) {
        return { success: false, exists: false, notFound: true, error: 'Room not found or has expired.' };
      }
      return await res.json();
    } catch {
      return {
        success: false,
        exists: false,
        unreachable: true,
        error: 'Kalesh server is waking up on Render. Please wait a moment...'
      };
    }
  };

  // Socket: Join Room
  const joinRoom = useCallback(
    ({ roomCode, name, avatar, isHost = false, hostToken = null }) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) return reject(new Error('Socket not connected'));

        const cleanCode = normalizeRoomCode(roomCode);
        socketRef.current.emit(
          'room:join',
          { roomCode: cleanCode, name, avatar, isHost, hostToken },
          (response) => {
            if (!response?.success) {
              toast.error(response?.error || 'Join room failed');
              return reject(new Error(response?.error));
            }

            setRoom(response.room);
            setParticipant(response.participant);
            setParticipants(response.room.participants || []);
            setPolls(response.room.polls || []);
            if (response.room.currentGame) {
              setCurrentGame(response.room.currentGame);
            }
            resolve(response);
          }
        );
      });
    },
    []
  );

  // Socket: Leave Room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
    }
    resetSession();
  }, [resetSession]);

  // Chat Actions
  const sendMessage = useCallback((text, replyTo = null) => {
    if (!socketRef.current || !text.trim()) return;
    socketRef.current.emit('chat:send', { text, isSecret: false, replyTo });
  }, []);

  const sendSecretMessage = useCallback((text) => {
    if (!socketRef.current || !text.trim()) return;
    socketRef.current.emit('chat:send', { text, isSecret: true });
    toast.success('Anonymous secret message sent! 🤫', {
      style: { background: '#11141e', color: '#fff' }
    });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:delete', { messageId });
  }, []);

  const reactToMessage = useCallback((messageId, emoji) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:react', { messageId, emoji });
  }, []);

  const setTyping = useCallback((isTyping) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:typing', { isTyping });
  }, []);

  // Poll Actions
  const createPoll = useCallback((question, options) => {
    if (!socketRef.current) return;
    socketRef.current.emit('poll:create', { question, options });
  }, []);

  const votePoll = useCallback((pollId, optionId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('poll:vote', { pollId, optionId });
  }, []);

  // Games Actions
  const triggerRandomTopic = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('topic:random');
  }, []);

  const startWhosMostLikely = useCallback((customQuestion = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('whos_most_likely:start', { customQuestion });
  }, []);

  const voteWhosMostLikely = useCallback((targetId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('whos_most_likely:vote', { targetId });
  }, []);

  const revealWhosMostLikely = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('whos_most_likely:reveal');
  }, []);

  const drawTruthOrDare = useCallback((type, targetParticipantId = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('truth_or_dare:draw', { type, targetParticipantId });
  }, []);

  const generateRoast = useCallback((targetParticipantId, level = 'mild') => {
    if (!socketRef.current) return;
    socketRef.current.emit('roast:generate', { targetParticipantId, level });
  }, []);

  // Floating Reaction Action
  const sendReaction = useCallback((emoji) => {
    if (!socketRef.current) return;
    socketRef.current.emit('reaction:send', { emoji });
  }, []);

  // Media state broadcast
  const updateMediaState = useCallback((updates) => {
    if (!socketRef.current) return;
    socketRef.current.emit('video:media-state', updates);
    setParticipant((curr) => (curr ? { ...curr, ...updates } : curr));
  }, []);

  // Chat Media Message (Image / GIF)
  const sendMediaMessage = useCallback(({ mediaUrl, mediaType = 'gif', text = '', isSecret = false, replyTo = null }) => {
    if (!socketRef.current || !mediaUrl) return;
    socketRef.current.emit('chat:send', { text, mediaUrl, mediaType, isSecret, replyTo });
  }, []);

  // Door Knocking & Waiting Room
  const knockRoom = useCallback(({ roomCode, name, avatar }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not connected'));

      const cleanCode = normalizeRoomCode(roomCode);
      socketRef.current.emit('room:knock', { roomCode: cleanCode, name, avatar }, (res) => {
        if (!res?.success) {
          return reject(new Error(res?.error || 'Knock failed'));
        }

        // If direct entry allowed (no host present)
        if (res.status === 'approved_direct') {
          return resolve({ status: 'approved' });
        }

        // Setup one-shot approval/rejection listeners
        const onApproved = () => {
          socketRef.current?.off('room:knock-rejected', onRejected);
          resolve({ status: 'approved' });
        };

        const onRejected = ({ reason }) => {
          socketRef.current?.off('room:knock-approved', onApproved);
          reject(new Error(reason || 'Host ne entry reject kar di! 💀'));
        };

        socketRef.current.once('room:knock-approved', onApproved);
        socketRef.current.once('room:knock-rejected', onRejected);
      });
    });
  }, []);

  const approveKnock = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:approve-knock', { targetSocketId });
    setPendingKnocks((prev) => prev.filter((k) => k.socketId !== targetSocketId));
  }, []);

  const rejectKnock = useCallback((targetSocketId, reason = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:reject-knock', { targetSocketId, reason });
    setPendingKnocks((prev) => prev.filter((k) => k.socketId !== targetSocketId));
  }, []);

  // Permission to Leave
  const requestLeavePermission = useCallback((reason = null) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return resolve(); // if disconnected, can leave directly

      socketRef.current.emit('room:request-leave', { reason }, (res) => {
        if (res?.status === 'host_direct') {
          return resolve(); // Host doesn't need approval
        }

        const onApproved = () => {
          socketRef.current?.off('room:leave-rejected', onRejected);
          resolve();
        };

        const onRejected = ({ message }) => {
          socketRef.current?.off('room:leave-approved', onApproved);
          reject(new Error(message || 'Host ne jaane se mana kar diya! 😂🔥'));
        };

        socketRef.current.once('room:leave-approved', onApproved);
        socketRef.current.once('room:leave-rejected', onRejected);
      });
    });
  }, []);

  const approveLeave = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:approve-leave', { targetSocketId });
    setLeaveRequests((prev) => prev.filter((l) => l.socketId !== targetSocketId));
  }, []);

  const rejectLeave = useCallback((targetSocketId, customMessage = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:reject-leave', { targetSocketId, customMessage });
    setLeaveRequests((prev) => prev.filter((l) => l.socketId !== targetSocketId));
  }, []);

  // Host Controls
  const hostMuteParticipant = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:mute', { targetSocketId });
  }, []);

  const hostRemoveParticipant = useCallback((targetSocketId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:remove', { targetSocketId });
  }, []);

  const endRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:end');
    resetSession();
  }, [resetSession]);

  const isHost = Boolean(participant?.isHost);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        room,
        participant,
        participants,
        messages,
        typingUsers,
        polls,
        currentGame,
        recentRoast,
        floatingReactions,
        pendingKnocks,
        leaveRequests,
        isHost,
        generateNewCode,
        createRoom,
        checkRoom,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendSecretMessage,
        sendMediaMessage,
        deleteMessage,
        reactToMessage,
        setTyping,
        createPoll,
        votePoll,
        triggerRandomTopic,
        startWhosMostLikely,
        voteWhosMostLikely,
        revealWhosMostLikely,
        drawTruthOrDare,
        generateRoast,
        sendReaction,
        updateMediaState,
        knockRoom,
        approveKnock,
        rejectKnock,
        requestLeavePermission,
        approveLeave,
        rejectLeave,
        hostMuteParticipant,
        hostRemoveParticipant,
        endRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
