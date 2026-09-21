import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.jsx';
import { useWebRTC } from '../../hooks/useWebRTC.js';
import { VideoGrid } from '../video/VideoGrid.jsx';
import { RoomHeader } from './RoomHeader.jsx';
import { RoomControls } from './RoomControls.jsx';
import { ChatDrawer } from '../chat/ChatDrawer.jsx';
import { GamesModal } from '../games/GamesModal.jsx';
import { PollsModal } from '../polls/PollsModal.jsx';
import { ActiveGameOverlay } from '../games/ActiveGameOverlay.jsx';
import { EndRoomDialog } from '../common/EndRoomDialog.jsx';
import { JoinRoomModal } from '../landing/JoinRoomModal.jsx';
import { HostApprovalModal } from './HostApprovalModal.jsx';
import { LeaveRequestModal } from './LeaveRequestModal.jsx';
import { GifPickerModal } from '../chat/GifPickerModal.jsx';
import { NotificationToastStack } from '../common/NotificationToastStack.jsx';
import { NotificationCenterPanel } from './NotificationCenterPanel.jsx';
import { SoundboardModal } from '../soundboard/SoundboardModal.jsx';
import { SoundboardBanner } from '../soundboard/SoundboardBanner.jsx';
import { VideoFiltersModal } from '../video/VideoFiltersModal.jsx';
import { HostControlsModal } from '../host/HostControlsModal.jsx';
import toast from 'react-hot-toast';

export function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const {
    room,
    participant,
    leaveRoom,
    joinRoom,
    isHost,
    roomSettings,
    messages,
    sendMediaMessage
  } = useSocket();

  // Initialize WebRTC P2P Mesh
  const {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useWebRTC();

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isEndRoomOpen, setIsEndRoomOpen] = useState(false);
  const [isNeedJoinOpen, setIsNeedJoinOpen] = useState(false);
  const [isLeaveReqOpen, setIsLeaveReqOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);

  // Unread chat messages counter
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(messages.length);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      setLastMessageCount(messages.length);
    } else if (messages.length > lastMessageCount) {
      setUnreadCount((prev) => prev + (messages.length - lastMessageCount));
      setLastMessageCount(messages.length);
    }
  }, [messages, isChatOpen, lastMessageCount]);

  // Handle room presence, refresh reconnect, and direct navigation
  const wasInRoomRef = useRef(false);
  const isReconnectingRef = useRef(false);

  useEffect(() => {
    if (room) {
      wasInRoomRef.current = true;
      setIsNeedJoinOpen(false);
      return;
    }

    if (wasInRoomRef.current) {
      // User was in room, but room ended or user was removed
      navigate('/');
      return;
    }

    // If refreshing on /room/:code and has stored session, auto-reconnect seamlessly
    const storedName = sessionStorage.getItem('kalesh_userName');
    const storedAvatar = sessionStorage.getItem('kalesh_avatar') || '🔥';
    const cleanCode = roomCode?.toUpperCase();
    const storedHostToken = cleanCode ? sessionStorage.getItem(`kalesh_host_${cleanCode}`) : null;

    if (cleanCode && storedName && !isReconnectingRef.current) {
      isReconnectingRef.current = true;
      joinRoom({
        roomCode: cleanCode,
        name: storedName,
        avatar: storedAvatar,
        isHost: Boolean(storedHostToken),
        hostToken: storedHostToken
      })
        .then(() => {
          setIsNeedJoinOpen(false);
        })
        .catch(() => {
          setIsNeedJoinOpen(true);
        });
    } else if (cleanCode) {
      // First time hitting /room/:code directly without session
      setIsNeedJoinOpen(true);
    }
  }, [room, roomCode, joinRoom, navigate]);

  const handleInviteClick = () => {
    const cleanCode = room?.code || roomCode;
    const inviteUrl = `${window.location.origin}/join/${cleanCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied! Send it to your friends 🔗', {
      icon: '📋'
    });
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
    toast('Aap kalesh chhod kar nikal gaye! 🏃', { icon: '👋' });
  };

  const handleLeaveTrigger = () => {
    if (isHost) {
      handleLeaveRoom();
    } else {
      setIsLeaveReqOpen(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] flex flex-col select-none">
      {/* Real-time Host Approval Notifications (Knock & Leave requests) */}
      <HostApprovalModal />

      {/* Discord-Style Soundboard Floating Banner */}
      <SoundboardBanner />

      {/* 15-Second Temporary Activity / Dare / Roast Notification Toasts */}
      <NotificationToastStack />

      {/* Collapsed Slide-Over Notification & Activity Center */}
      <NotificationCenterPanel />

      {/* Dynamic Top Room Navigation Bar */}
      <RoomHeader
        onInviteClick={handleInviteClick}
        onLeaveClick={handleLeaveTrigger}
        onEndRoomClick={() => setIsEndRoomOpen(true)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
      />

      {/* Real-Time Active Game / Prompt Overlay */}
      <ActiveGameOverlay />

      {/* Center Interactive WebRTC Video Grid */}
      <main className="flex-1 relative w-full h-[calc(100vh-4rem)] overflow-hidden pb-20 sm:pb-24">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onInviteClick={handleInviteClick}
        />
      </main>

      {/* Floating Bottom Control Dock */}
      <RoomControls
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        onOpenGames={() => setIsGamesOpen(true)}
        onOpenPolls={() => setIsPollsOpen(true)}
        onOpenGifs={() => setIsGifPickerOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenFilters={() => setIsFiltersOpen(true)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        onRequestLeave={() => setIsLeaveReqOpen(true)}
        onEndRoom={() => setIsEndRoomOpen(true)}
        isHost={isHost}
        roomSettings={roomSettings}
      />

      {/* Live Ephemeral Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        localStream={localStream}
      />

      {/* Kalesh Games Suite Modal */}
      <GamesModal
        isOpen={isGamesOpen}
        onClose={() => setIsGamesOpen(false)}
      />

      {/* Anonymous Polls Modal */}
      <PollsModal
        isOpen={isPollsOpen}
        onClose={() => setIsPollsOpen(false)}
      />

      {/* GIF, Memes & Media Picker Modal */}
      <GifPickerModal
        isOpen={isGifPickerOpen}
        onClose={() => setIsGifPickerOpen(false)}
        localStream={localStream}
        onSendMedia={({ mediaUrl, mediaType, text }) => {
          sendMediaMessage({ mediaUrl, mediaType, text });
          setIsGifPickerOpen(false);
          setIsChatOpen(true);
        }}
      />

      {/* Non-host Permission to Leave Modal */}
      <LeaveRequestModal
        isOpen={isLeaveReqOpen}
        onClose={() => setIsLeaveReqOpen(false)}
        onApprovedLeave={handleLeaveRoom}
      />

      {/* Host End Room Confirmation Dialog */}
      <EndRoomDialog
        isOpen={isEndRoomOpen}
        onClose={() => setIsEndRoomOpen(false)}
      />

      {/* Discord-Style Soundboard & Custom Uploader Modal */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      {/* Video Filters & Camera Effects Modal */}
      <VideoFiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        localStream={localStream}
      />

      {/* Exclusive Host Moderation Control Center */}
      <HostControlsModal
        isOpen={isHostControlsOpen}
        onClose={() => setIsHostControlsOpen(false)}
        onOpenEndRoom={() => {
          setIsHostControlsOpen(false);
          setIsEndRoomOpen(true);
        }}
      />

      {/* If directly navigated to room URL without joining */}
      <JoinRoomModal
        isOpen={isNeedJoinOpen}
        initialCode={roomCode || ''}
        onClose={() => {
          setIsNeedJoinOpen(false);
          if (!room) navigate('/');
        }}
        onJoinSuccess={() => setIsNeedJoinOpen(false)}
      />
    </div>
  );
}
