import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.jsx';
import { useWebRTC } from '../../hooks/useWebRTC.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { VideoGrid } from '../video/VideoGrid.jsx';
import { RoomHeader } from './RoomHeader.jsx';
import { MeetControlBar } from './MeetControlBar.jsx';
import { PreJoinLobby } from './PreJoinLobby.jsx';
import { ChatDrawer } from '../chat/ChatDrawer.jsx';
import { GamesModal } from '../games/GamesModal.jsx';
import { PollsModal } from '../polls/PollsModal.jsx';
import { ActiveGameOverlay } from '../games/ActiveGameOverlay.jsx';
import { EndRoomDialog } from '../common/EndRoomDialog.jsx';
import { HostApprovalModal } from './HostApprovalModal.jsx';
import { LeaveRequestModal } from './LeaveRequestModal.jsx';
import { GifPickerModal } from '../chat/GifPickerModal.jsx';
import { NotificationToastStack } from '../common/NotificationToastStack.jsx';
import { NotificationCenterPanel } from './NotificationCenterPanel.jsx';
import { SoundboardModal } from '../soundboard/SoundboardModal.jsx';
import { SoundboardBanner } from '../soundboard/SoundboardBanner.jsx';
import { VideoFiltersModal } from '../video/VideoFiltersModal.jsx';
import { HostControlsModal } from '../host/HostControlsModal.jsx';
import { MeetingDetailsModal } from '../meeting/MeetingDetailsModal.jsx';
import { AttendanceModal } from '../meeting/AttendanceModal.jsx';
import { DeviceSettingsModal } from '../meeting/DeviceSettingsModal.jsx';
import { RecordingPlaybackModal } from '../meeting/RecordingPlaybackModal.jsx';
import { LiveCaptionsOverlay } from '../meeting/LiveCaptionsOverlay.jsx';
import { EducationalWhiteboardModal } from './EducationalWhiteboardModal.jsx';
import { StudyMaterialsDrawer } from './StudyMaterialsDrawer.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    room,
    participant,
    participants,
    leaveRoom,
    joinRoom,
    isHost,
    roomSettings,
    messages,
    sendMediaMessage,
    isHandRaised,
    raiseHand,
    lowerHand,
    isCaptionsEnabled,
    toggleCaptions,
    isRecording,
    recordingDuration,
    broadcastRecordingStatus
  } = useSocket();

  // Initialize WebRTC
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

  // Meeting Metadata from MongoDB
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isWaitingHost, setIsWaitingHost] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isEndRoomOpen, setIsEndRoomOpen] = useState(false);
  const [isLeaveReqOpen, setIsLeaveReqOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isStudyMaterialsOpen, setIsStudyMaterialsOpen] = useState(false);

  // Recording internals
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [localRecordingSeconds, setLocalRecordingSeconds] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState(null);

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

  // Fetch meeting metadata from backend
  useEffect(() => {
    if (!roomCode) return;
    api
      .get(`/api/meetings/${roomCode}`)
      .then((res) => {
        if (res.success && res.meeting) {
          setMeetingDetails(res.meeting);
        }
      })
      .catch((err) => {
        console.warn('[RoomPage] Meeting info fetch:', err.message);
      });
  }, [roomCode]);

  // Keyboard Shortcuts: Ctrl+D for Mic, Ctrl+E for Camera, Ctrl+H for Hand Raise
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleAudio();
        toast(isAudioMuted ? 'Mic unmuted' : 'Mic muted', { icon: isAudioMuted ? '🎙️' : '🔇' });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggleVideo();
        toast(isVideoOff ? 'Camera turned on' : 'Camera turned off', { icon: isVideoOff ? '📹' : '📷' });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleToggleHandRaise();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioMuted, isVideoOff, isHandRaised, toggleAudio, toggleVideo]);

  // Hand raise toggle
  const handleToggleHandRaise = () => {
    if (isHandRaised) {
      lowerHand();
      toast('Hand lowered', { icon: '⬇️' });
    } else {
      raiseHand();
      toast.success('Hand raised! ✋');
    }
  };

  // Join action from PreJoinLobby
  const handleLobbyJoin = async ({ name, avatar, isAudioMuted: initialMuted, isVideoOff: initialVideoOff, startPresenting }) => {
    const cleanCode = roomCode.toUpperCase();
    const storedHostToken = sessionStorage.getItem(`kalesh_host_${cleanCode}`);

    const isOwner = Boolean(
      storedHostToken ||
      (user?.role === 'admin') ||
      (user?.role === 'faculty' && meetingDetails && (
        (meetingDetails.hostId && user && meetingDetails.hostId.toString() === (user._id || user.id).toString()) ||
        (meetingDetails.hostEmail && user && meetingDetails.hostEmail === user.email)
      ))
    );

    try {
      await joinRoom({
        roomCode: cleanCode,
        name: user?.name || name,
        avatar: user?.avatar || avatar,
        email: user?.email || '',
        role: user?.role || (isOwner ? 'faculty' : 'student'),
        isHost: isOwner,
        hostToken: storedHostToken
      });

      setIsInMeeting(true);

      // Apply initial mute or camera off states
      if (initialMuted && !isAudioMuted) toggleAudio();
      if (initialVideoOff && !isVideoOff) toggleVideo();
      if (startPresenting && !isScreenSharing) toggleScreenShare();
    } catch (err) {
      toast.error(err.message || 'Could not join meeting.');
    }
  };

  // Browser MediaRecorder Recording Implementation
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          toast.error('Screen capture is not supported in this browser.');
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: true
        });

        // Mix screen stream audio with local microphone audio if available
        let recordStream = screenStream;
        if (localStream && localStream.getAudioTracks().length > 0) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const dest = ctx.createMediaStreamDestination();

            const micSource = ctx.createMediaStreamSource(localStream);
            micSource.connect(dest);

            if (screenStream.getAudioTracks().length > 0) {
              const screenAudioSource = ctx.createMediaStreamSource(screenStream);
              screenAudioSource.connect(dest);
            }

            recordStream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...dest.stream.getAudioTracks()
            ]);
          }
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';

        const recorder = new MediaRecorder(recordStream, { mimeType });
        mediaRecorderRef.current = recorder;
        recordingChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordingChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          clearInterval(recordingTimerRef.current);
          const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
          setRecordingBlob(blob);
          setIsRecordingModalOpen(true);
          broadcastRecordingStatus(false, 0);

          // Save recording metadata to database
          api
            .post('/api/recordings', {
              meetingCode: roomCode,
              title: `${meetingDetails?.title || 'Meeting'} Recording`,
              durationSeconds: localRecordingSeconds,
              fileSize: blob.size
            })
            .catch(() => {});

          recordStream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(1000); // 1-second chunks
        broadcastRecordingStatus(true, 0);
        setLocalRecordingSeconds(0);

        recordingTimerRef.current = setInterval(() => {
          setLocalRecordingSeconds((prev) => prev + 1);
        }, 1000);

        toast.success('Meeting recording started! 🔴');
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Could not start recording: ' + err.message);
        }
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordingTimerRef.current);
      toast('Recording stopped. Preparing preview...', { icon: '⏹️' });
    }
  };

  const handleLeaveMeeting = () => {
    leaveRoom();
    navigate('/');
    toast('Left the meeting', { icon: '👋' });
  };

  const handleEndMeetingForEveryone = async () => {
    try {
      const cleanCode = roomCode.toUpperCase();
      const storedHostToken = sessionStorage.getItem(`kalesh_host_${cleanCode}`);
      await api.post(`/api/meetings/${roomCode}/end`, {}, {
        headers: storedHostToken ? { 'x-host-token': storedHostToken } : {}
      });
      toast.success('Lecture ended for all participants.');
    } catch (e) {
      toast.error(e.message || 'Only the faculty host can end the lecture.');
      return;
    }
    leaveRoom();
    navigate('/dashboard');
  };

  // If user hasn't joined call yet, show the Google Meet PreJoin Green Room Lobby!
  if (!isInMeeting && !room) {
    return (
      <PreJoinLobby
        roomCode={roomCode}
        meetingDetails={meetingDetails}
        onJoin={handleLobbyJoin}
        isWaitingHost={isWaitingHost}
        waitingMessage={waitingMessage}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#202124] flex flex-col select-none">
      {/* Real-time Host Approval Notifications */}
      <HostApprovalModal />

      {/* Discord-Style Soundboard Floating Banner */}
      <SoundboardBanner />

      {/* Activity / Dare / Roast Notification Toasts */}
      <NotificationToastStack />

      {/* Collapsed Slide-Over Notification & Activity Center */}
      <NotificationCenterPanel />

      {/* Top CampusVerse Live Room Header */}
      <RoomHeader
        meetingDetails={meetingDetails}
        onInviteClick={() => setIsDetailsOpen(true)}
        onLeaveClick={handleLeaveMeeting}
        onEndRoomClick={() => setIsEndRoomOpen(true)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
      />

      {/* Live Captions Subtitle Overlay */}
      <LiveCaptionsOverlay isLocalAudioMuted={isAudioMuted} />

      {/* Real-Time Active Game / Prompt Overlay */}
      <ActiveGameOverlay />

      {/* Center Interactive WebRTC Video Grid */}
      <main className="flex-1 relative w-full h-[calc(100vh-8rem)] overflow-hidden pb-4">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onInviteClick={() => setIsDetailsOpen(true)}
        />
      </main>

      {/* CampusVerse Live Bottom Control Bar */}
      <MeetControlBar
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isCaptionsEnabled={isCaptionsEnabled}
        isRecording={isRecording}
        recordingDuration={localRecordingSeconds || recordingDuration}
        unreadCount={unreadCount}
        participantsCount={participants.length}
        roomCode={roomCode}
        isHost={isHost}
        roomSettings={roomSettings}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onToggleCaptions={toggleCaptions}
        onToggleRecording={handleToggleRecording}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        onOpenStudyMaterials={() => setIsStudyMaterialsOpen(true)}
        onOpenDetails={() => setIsDetailsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFilters={() => setIsFiltersOpen(true)}
        onOpenAttendance={() => setIsAttendanceOpen(true)}
        onOpenActivities={(type) => {
          if (type === 'games') setIsGamesOpen(true);
          if (type === 'polls') setIsPollsOpen(true);
          if (type === 'soundboard') setIsSoundboardOpen(true);
        }}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeetingForEveryone={handleEndMeetingForEveryone}
      />

      {/* Live Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        localStream={localStream}
      />

      {/* Meeting Details Modal (Link copy & Calendar .ICS download) */}
      <MeetingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        meeting={meetingDetails}
        roomCode={roomCode}
      />

      {/* Classroom Attendance Tracker Modal */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        roomCode={roomCode}
        isHost={isHost}
        onClose={() => setIsAttendanceOpen(false)}
      />

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Meeting Recording Playback & Download Modal */}
      <RecordingPlaybackModal
        isOpen={isRecordingModalOpen}
        recordingBlob={recordingBlob}
        durationSeconds={localRecordingSeconds}
        roomCode={roomCode}
        onClose={() => setIsRecordingModalOpen(false)}
      />

      {/* Games Modal */}
      <GamesModal isOpen={isGamesOpen} onClose={() => setIsGamesOpen(false)} />

      {/* Polls Modal */}
      <PollsModal isOpen={isPollsOpen} onClose={() => setIsPollsOpen(false)} />

      {/* GIF & Memes Picker */}
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

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveReqOpen}
        onClose={() => setIsLeaveReqOpen(false)}
        onApprovedLeave={handleLeaveMeeting}
      />

      {/* End Room Confirmation Dialog */}
      <EndRoomDialog isOpen={isEndRoomOpen} onClose={() => setIsEndRoomOpen(false)} />

      {/* Soundboard Modal */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      {/* Video Filters Modal */}
      <VideoFiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        localStream={localStream}
      />

      {/* Educational Whiteboard Modal */}
      <EducationalWhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      {/* Classroom Study Materials Drawer */}
      <StudyMaterialsDrawer
        isOpen={isStudyMaterialsOpen}
        onClose={() => setIsStudyMaterialsOpen(false)}
        isHost={isHost}
      />

      {/* Host Controls Modal */}
      <HostControlsModal
        isOpen={isHostControlsOpen}
        onClose={() => setIsHostControlsOpen(false)}
        onOpenEndRoom={() => {
          setIsHostControlsOpen(false);
          setIsEndRoomOpen(true);
        }}
      />
    </div>
  );
}
