import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { socket } = useSocket();

  // Active toasts currently shown on screen (auto-dismiss after 15s)
  const [activeToasts, setActiveToasts] = useState([]);

  // Persistent history of all notifications for Notification Center
  const [history, setHistory] = useState([]);

  // Unread count for the notification badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Notification panel open state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Add a new notification (visible for ~15 seconds, then archived)
  const addNotification = useCallback(({
    type = 'activity', // 'dare' | 'roast' | 'topic' | 'poll' | 'reaction' | 'meeting'
    title,
    description,
    senderName,
    senderAvatar,
    badge
  }) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const notification = {
      id,
      type,
      title,
      description,
      senderName: senderName || 'Room Member',
      senderAvatar: senderAvatar || '🔔',
      badge: badge || type.toUpperCase(),
      timestamp: Date.now()
    };

    // 1. Add to persistent history
    setHistory((prev) => [notification, ...prev.slice(0, 50)]); // keep last 50
    setUnreadCount((prev) => prev + 1);

    // 2. Add to active toasts (max 3 visible simultaneously)
    setActiveToasts((prev) => {
      const updated = [...prev, notification];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    // 3. Auto-hide from screen after 15 seconds
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== id));
    }, 15000);
  }, []);

  const dismissToast = useCallback((id) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    setUnreadCount(0); // Clear badge on open
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, []);

  // Listen to socket events and feed notification system
  useEffect(() => {
    if (!socket) return;

    // Truth or Dare
    const handleTruthOrDare = (gameData) => {
      const isDare = gameData.mode === 'dare';
      addNotification({
        type: 'dare',
        title: isDare ? '⚡ Dare Challenge!' : '🤫 Truth Challenge!',
        description: `"${gameData.prompt}"`,
        senderName: gameData.target ? `Target: ${gameData.target.name}` : 'Everyone',
        senderAvatar: isDare ? '⚡' : '🤫',
        badge: isDare ? 'DARE' : 'TRUTH'
      });
    };

    // Roast Attack
    const handleRoast = (roast) => {
      addNotification({
        type: 'roast',
        title: `💀 Roast Attack (${roast.level})`,
        description: `"${roast.roastText}"`,
        senderName: `By ${roast.senderName}`,
        senderAvatar: '🔥',
        badge: 'ROAST'
      });
    };

    // Spicy Topic
    const handleTopic = ({ topic }) => {
      addNotification({
        type: 'topic',
        title: '🌶️ Spicy Debate Topic',
        description: `"${topic}"`,
        senderName: 'Room Host',
        senderAvatar: '⚡',
        badge: 'TOPIC'
      });
    };

    // Poll created
    const handlePoll = (poll) => {
      addNotification({
        type: 'poll',
        title: '🗳️ New Anonymous Poll',
        description: `"${poll.question}"`,
        senderName: 'Poll Creator',
        senderAvatar: '🗳️',
        badge: 'POLL'
      });
    };

    // Reaction received
    const handleReaction = (reaction) => {
      addNotification({
        type: 'reaction',
        title: `${reaction.emoji} Reaction Dropped`,
        description: `Reaction from participant`,
        senderName: 'Participant',
        senderAvatar: reaction.emoji,
        badge: 'REACTION'
      });
    };

    // Participant joined
    const handleJoined = ({ participant: peer }) => {
      addNotification({
        type: 'meeting',
        title: 'Participant Joined',
        description: `${peer.name} entered the room`,
        senderName: peer.name,
        senderAvatar: peer.avatar || '👤',
        badge: 'JOIN'
      });
    };

    // Participant left
    const handleLeft = ({ participantName }) => {
      if (participantName) {
        addNotification({
          type: 'meeting',
          title: 'Participant Left',
          description: `${participantName} left the room`,
          senderName: participantName,
          senderAvatar: '👋',
          badge: 'LEAVE'
        });
      }
    };

    socket.on('truth_or_dare:prompt', handleTruthOrDare);
    socket.on('roast:generated', handleRoast);
    socket.on('topic:updated', handleTopic);
    socket.on('poll:created', handlePoll);
    socket.on('reaction:received', handleReaction);
    socket.on('participant:joined', handleJoined);
    socket.on('participant:left', handleLeft);

    return () => {
      socket.off('truth_or_dare:prompt', handleTruthOrDare);
      socket.off('roast:generated', handleRoast);
      socket.off('topic:updated', handleTopic);
      socket.off('poll:created', handlePoll);
      socket.off('reaction:received', handleReaction);
      socket.off('participant:joined', handleJoined);
      socket.off('participant:left', handleLeft);
    };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        activeToasts,
        history,
        unreadCount,
        isPanelOpen,
        addNotification,
        dismissToast,
        openPanel,
        closePanel,
        togglePanel,
        clearHistory
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
