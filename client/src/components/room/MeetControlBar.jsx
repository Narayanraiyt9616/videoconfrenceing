import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Hand,
  Smile,
  Subtitles,
  Settings,
  PhoneOff,
  MessageSquare,
  Users,
  Info,
  GraduationCap,
  PenTool,
  BookOpen,
  Wand2,
  CircleDot,
  MoreVertical,
  LogOut,
  Sparkles,
  Gamepad2,
  Vote,
  Volume2
} from 'lucide-react';
import { LeaveClassModal } from './LeaveClassModal.jsx';
import { ReactionPicker } from '../common/ReactionPicker.jsx';

export function MeetControlBar({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  isCaptionsEnabled,
  isRecording,
  recordingDuration = 0,
  unreadCount = 0,
  participantsCount = 1,
  roomCode,
  isHost,
  roomSettings,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleCaptions,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onOpenWhiteboard,
  onOpenStudyMaterials,
  onOpenDetails,
  onOpenSettings,
  onOpenFilters,
  onOpenAttendance,
  onOpenActivities,
  onLeaveMeeting,
  onEndMeetingForEveryone
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [meetingTime, setMeetingTime] = useState('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setMeetingTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 h-20 px-3 sm:px-6 bg-white border-t border-[#CBD5E1] shadow-lg flex items-center justify-between select-none">
        {/* Floating Reaction Picker Popover */}
        <AnimatePresence>
          {showReactionPicker && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
              <ReactionPicker onClose={() => setShowReactionPicker(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Left: Academic Clock & Code */}
        <div className="hidden lg:flex items-center gap-3 w-48">
          <div className="text-xs font-semibold text-[#0F172A]">
            <span>{meetingTime}</span>
            <span className="mx-2 text-[#CBD5E1]">|</span>
            <span className="font-mono text-[#1E3A8A] font-bold">{roomCode}</span>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold animate-pulse">
              <CircleDot className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>REC {formatRecordingTime(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Center: The Exact 10 CampusVerse Live Classroom Controls */}
        <div className="flex items-center gap-1 sm:gap-2 justify-center flex-1 max-w-4xl mx-auto overflow-x-auto py-1">
          {/* 1. Microphone */}
          <button
            type="button"
            onClick={onToggleAudio}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title={isAudioMuted ? 'Turn on Microphone (Ctrl + D)' : 'Turn off Microphone (Ctrl + D)'}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                isAudioMuted
                  ? 'bg-[#DC2626] text-white hover:bg-red-700'
                  : 'bg-[#F1F5F9] text-[#1E3A8A] border border-[#CBD5E1] group-hover:bg-[#2563EB] group-hover:text-white'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Microphone
            </span>
          </button>

          {/* 2. Camera */}
          <button
            type="button"
            onClick={onToggleVideo}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title={isVideoOff ? 'Turn on Camera (Ctrl + E)' : 'Turn off Camera (Ctrl + E)'}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                isVideoOff
                  ? 'bg-[#DC2626] text-white hover:bg-red-700'
                  : 'bg-[#F1F5F9] text-[#1E3A8A] border border-[#CBD5E1] group-hover:bg-[#2563EB] group-hover:text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Camera
            </span>
          </button>

          {/* 3. Share Screen */}
          <button
            type="button"
            onClick={onToggleScreenShare}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                isScreenSharing
                  ? 'bg-[#0D9488] text-white shadow-md'
                  : 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] group-hover:bg-[#0D9488] group-hover:text-white'
              }`}
            >
              <MonitorUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Share Screen
            </span>
          </button>

          {/* 4. Participants */}
          <button
            type="button"
            onClick={onToggleParticipants}
            className="relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title="Classroom Participants"
          >
            <div className="relative w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#1E3A8A] border border-[#CBD5E1] group-hover:bg-[#1E3A8A] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-[#1E3A8A] text-white text-[9px] font-bold">
                {participantsCount}
              </span>
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Participants
            </span>
          </button>

          {/* 5. Classroom Chat */}
          <button
            type="button"
            onClick={onToggleChat}
            className="relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title="Classroom Chat"
          >
            <div className="relative w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#1E3A8A] border border-[#CBD5E1] group-hover:bg-[#1E3A8A] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-[#2563EB] text-white text-[9px] font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Classroom Chat
            </span>
          </button>

          {/* 6. Raise Hand */}
          <button
            type="button"
            onClick={onToggleHandRaise}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                isHandRaised
                  ? 'bg-[#F59E0B] text-white shadow-md'
                  : 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] group-hover:bg-[#F59E0B] group-hover:text-white'
              }`}
            >
              <Hand className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Raise Hand
            </span>
          </button>

          {/* 7. Whiteboard */}
          <button
            type="button"
            onClick={onOpenWhiteboard}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title="Interactive Whiteboard"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0D9488] border border-[#CBD5E1] group-hover:bg-[#0D9488] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Whiteboard
            </span>
          </button>

          {/* 8. Study Materials */}
          <button
            type="button"
            onClick={onOpenStudyMaterials}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
            title="Study Materials & Resources"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#1E3A8A] border border-[#CBD5E1] group-hover:bg-[#1E3A8A] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
              Study Materials
            </span>
          </button>

          {/* 9. More Options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-[#F1F5F9]"
              title="More Classroom Options"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] group-hover:bg-slate-200 flex items-center justify-center transition-all shadow-xs">
                <MoreVertical className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-1 text-[#0F172A] leading-none truncate">
                More Options
              </span>
            </button>

            {/* More Options Popover */}
            {showMoreMenu && (
              <div
                className="absolute bottom-16 right-0 sm:left-1/2 sm:-translate-x-1/2 w-56 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xl p-2 space-y-1 z-50 text-xs font-sans"
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                {/* Faculty Attendance Tracker */}
                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenAttendance?.();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-[#0F172A] flex items-center gap-2.5 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-[#16A34A]" />
                    <span className="font-semibold">Class Attendance</span>
                  </button>
                )}

                {/* Live Captions */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onToggleCaptions?.();
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-[#0F172A] flex items-center gap-2.5 cursor-pointer"
                >
                  <Subtitles className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold">
                    {isCaptionsEnabled ? 'Turn off Live Captions' : 'Turn on Live Captions'}
                  </span>
                </button>

                {/* Audio & Video Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSettings?.();
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-[#0F172A] flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#64748B]" />
                  <span className="font-semibold">Device Settings</span>
                </button>

                {/* Video Filters */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenFilters?.();
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-[#0F172A] flex items-center gap-2.5 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-[#0D9488]" />
                  <span className="font-semibold">Background Effects</span>
                </button>

                {/* Polls & Quizzes */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenActivities?.('polls');
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-[#0F172A] flex items-center gap-2.5 cursor-pointer"
                >
                  <Vote className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-semibold">Polls & Quizzes</span>
                </button>

                {/* Faculty Recording trigger */}
                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onToggleRecording?.();
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 cursor-pointer border-t border-[#E2E8F0] ${
                      isRecording ? 'hover:bg-red-50 text-red-600' : 'hover:bg-slate-100 text-[#0F172A]'
                    }`}
                  >
                    <CircleDot className={`w-4 h-4 ${isRecording ? 'text-red-600' : 'text-slate-400'}`} />
                    <span className="font-bold">
                      {isRecording ? 'Stop Recording' : 'Record Lecture'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 10. Leave Class */}
          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[62px] p-1 rounded-xl transition-all cursor-pointer group hover:bg-red-50"
            title="Leave Classroom"
          >
            <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white hover:bg-red-700 flex items-center justify-center transition-all shadow-xs">
              <PhoneOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-[#DC2626] leading-none truncate">
              Leave Class
            </span>
          </button>
        </div>

        {/* Right Info */}
        <div className="hidden lg:flex items-center gap-2 w-48 justify-end">
          <button
            type="button"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="w-9 h-9 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            title="Send Emoji Reaction"
          >
            <Smile className="w-4 h-4 text-[#F59E0B]" />
          </button>

          <button
            type="button"
            onClick={onOpenDetails}
            className="w-9 h-9 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            title="Classroom Information"
          >
            <Info className="w-4 h-4 text-[#2563EB]" />
          </button>
        </div>
      </div>

      {/* Leave Class Confirmation Modal */}
      <LeaveClassModal
        isOpen={isLeaveModalOpen}
        isHost={isHost}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeaveOnly={() => {
          setIsLeaveModalOpen(false);
          onLeaveMeeting();
        }}
        onEndForEveryone={() => {
          setIsLeaveModalOpen(false);
          onEndMeetingForEveryone();
        }}
      />
    </>
  );
}
