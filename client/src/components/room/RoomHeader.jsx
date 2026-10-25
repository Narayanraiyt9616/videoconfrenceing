import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Share2,
  Users,
  Volume2,
  VolumeX,
  Crown,
  MicOff,
  UserX,
  ChevronDown,
  ShieldCheck,
  Bell,
  GraduationCap,
  Clock,
  BookOpen
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { soundFx } from '../../utils/soundFx.js';
import toast from 'react-hot-toast';

export function RoomHeader({
  meetingDetails,
  onInviteClick,
  onLeaveClick,
  onEndRoomClick,
  onOpenHostControls
}) {
  const {
    room,
    participant,
    participants,
    isHost,
    roomSettings,
    hostMuteParticipant,
    hostRemoveParticipant
  } = useSocket();

  const { unreadCount, togglePanel } = useNotifications();

  const [copiedCode, setCopiedCode] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(soundFx.muted);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Classroom active timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyCode = () => {
    const code = room?.code || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Classroom code copied! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsSoundMuted(muted);
    toast(muted ? 'Classroom sound FX muted' : 'Classroom sound FX unmuted', {
      icon: muted ? '🔇' : '🔊'
    });
  };

  const classTitle = meetingDetails?.title || room?.name || 'Live Lecture Session';
  const subjectName = meetingDetails?.courseCode || meetingDetails?.description || 'Academic Subject';
  const facultyName = meetingDetails?.hostName || (isHost ? participant?.name : 'Faculty Member');
  const classType = meetingDetails?.classType || 'Live Lecture';

  return (
    <header className="relative w-full h-16 px-4 sm:px-6 flex items-center justify-between border-b border-[#E2E8F0] bg-white z-30 shadow-xs">
      {/* Left: Branding & Academic Lecture Details */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#1E3A8A] tracking-tight leading-none">
              CampusVerse Live
            </span>
            <span className="text-[10px] font-semibold text-[#0D9488] leading-none mt-0.5">
              Classroom
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-8 bg-[#E2E8F0] mx-1" />

        {/* Class Metadata */}
        <div className="hidden sm:flex flex-col max-w-[200px] md:max-w-[280px]">
          <div className="flex items-center gap-1.5 truncate">
            <h2 className="text-xs font-bold text-[#0F172A] truncate" title={classTitle}>
              {classTitle}
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1E3A8A]/10 text-[#1E3A8A] shrink-0">
              {classType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
            <span className="truncate">{subjectName}</span>
            <span>•</span>
            <span className="truncate text-[#0D9488] font-semibold">{facultyName}</span>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] hover:border-[#2563EB] transition-colors text-xs font-mono font-bold text-[#1E3A8A] group cursor-pointer"
          title="Click to copy classroom code"
        >
          <span>{room?.code}</span>
          {copiedCode ? (
            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E3A8A]" />
          )}
        </button>

        {/* Locked status */}
        {roomSettings?.isLocked && (
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase">
            <span>Locked 🔒</span>
          </div>
        )}
      </div>

      {/* Center: Meeting Duration & Connection Status */}
      <div className="hidden md:flex items-center gap-3">
        {/* Active Class Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
        </div>

        {/* Stable connection badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/30 text-xs font-bold text-[#16A34A]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>Connection Stable</span>
        </div>
      </div>

      {/* Right: Participants list, Host controls, Sound FX, Invite */}
      <div className="flex items-center gap-2">
        {/* Participants dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowParticipantsList(!showParticipantsList)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 border border-[#CBD5E1] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{participants.length}</span>
            <ChevronDown className="w-3 h-3 text-[#64748B]" />
          </button>

          {/* Participants Dropdown Popover */}
          {showParticipantsList && (
            <div className="absolute right-0 mt-2 w-72 p-3 rounded-xl bg-white border border-[#CBD5E1] shadow-xl z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#0F172A]">Classroom Participants</span>
                <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">
                  {participants.length} Active
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-xs border border-[#E2E8F0]/60"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{p.avatar || '🎓'}</span>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-[#0F172A] truncate">
                          {p.name} {p.id === participant?.id ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-[#64748B] capitalize">
                          {p.isHost ? 'Faculty Host' : (p.role || 'Student')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" title="Faculty Host" />
                      )}

                      {/* Faculty Moderation Controls */}
                      {isHost && p.id !== participant?.id && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => hostMuteParticipant(p.id)}
                            className="p-1 rounded text-[#64748B] hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Mute participant"
                          >
                            <MicOff className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => hostRemoveParticipant(p.id)}
                            className="p-1 rounded text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove from classroom"
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Host Control Center Button (Only for Faculty / Host) */}
        {isHost && (
          <button
            type="button"
            onClick={onOpenHostControls}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E3A8A]/10 hover:bg-[#1E3A8A] border border-[#1E3A8A]/30 text-[#1E3A8A] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Faculty Classroom Controls"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FACULTY</span>
          </button>
        )}

        {/* Notification / Activity Center Trigger */}
        <button
          type="button"
          onClick={togglePanel}
          className="relative p-2 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 border border-[#CBD5E1] text-[#0F172A] transition-colors cursor-pointer"
          title="Classroom Notifications & Announcements"
        >
          <Bell className="w-4 h-4 text-[#2563EB]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-[9px] font-bold text-white flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Share / Invite Students Button */}
        <button
          type="button"
          onClick={onInviteClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share Link</span>
        </button>

        {/* Audio FX Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="p-2 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 border border-[#CBD5E1] text-[#64748B] transition-colors cursor-pointer"
          title={isSoundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#2563EB]" />}
        </button>
      </div>
    </header>
  );
}
