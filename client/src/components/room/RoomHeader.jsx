import React, { useState } from 'react';
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
  Bell
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { soundFx } from '../../utils/soundFx.js';
import toast from 'react-hot-toast';

export function RoomHeader({ onInviteClick, onLeaveClick, onEndRoomClick, onOpenHostControls }) {
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

  const handleCopyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    toast.success('Room code copied! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsSoundMuted(muted);
    toast(muted ? 'Sound FX muted 🔇' : 'Sound FX unmuted 🔊', {
      style: { background: '#181818', color: '#ffa31a', border: '1px solid #333333' }
    });
  };

  return (
    <header className="relative w-full h-16 px-4 flex items-center justify-between border-b border-[#262626] bg-[#0c0c0c] z-30">
      {/* Left: Branding & Room Code */}
      <div className="flex items-center gap-3">
        <div className="flex items-center select-none cursor-pointer">
          <span className="text-xl font-black tracking-tight text-white">KALESH</span>
          <span className="bg-[#ffa31a] text-black text-xs px-2 py-0.5 rounded font-black tracking-tight ml-1">
            hub
          </span>
        </div>

        <div className="hidden sm:block pl-2 border-l border-[#2e2e2e]">
          <h2 className="text-sm font-bold text-white leading-tight truncate max-w-[180px] md:max-w-[240px]">
            {room?.name || 'Aaj Ka Kalesh'}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-[#888888]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffa31a] animate-ping" />
            <span>RAM Only • Zero DB</span>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333333] hover:border-[#ffa31a] transition-colors text-xs font-mono font-bold text-white group cursor-pointer"
          title="Click to copy room code"
        >
          <span className="text-[#ffa31a]">{room?.code}</span>
          {copiedCode ? (
            <Check className="w-3.5 h-3.5 text-[#ffa31a]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#888888] group-hover:text-white" />
          )}
        </button>

        {/* Room Locked Badge */}
        {roomSettings?.isLocked && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            <span>LOCKED 🔒</span>
          </div>
        )}
      </div>

      {/* Center: HD Streaming Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#2e2e2e] text-xs font-bold text-[#b5b5b5]">
        <span className="text-[#ffa31a] font-extrabold">1080p HD</span>
        <span>•</span>
        <span>PEER-TO-PEER MESH</span>
      </div>

      {/* Right: Participants list toggle, Audio FX, Share */}
      <div className="flex items-center gap-2">
        {/* Participants dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowParticipantsList(!showParticipantsList)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#ffa31a]" />
            <span>{participants.length}</span>
            <ChevronDown className="w-3 h-3 text-[#888888]" />
          </button>

          {/* Participants Dropdown Popover */}
          {showParticipantsList && (
            <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-[#181818] border border-[#333333] shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282828]">
                <span className="text-xs font-bold text-white">Participants</span>
                <span className="text-[10px] font-bold text-[#ffa31a]">
                  {participants.length} / {room?.maxParticipants || 10}
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#111111] hover:bg-[#222222] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{p.avatar}</span>
                      <span className="font-semibold text-white truncate">
                        {p.name} {p.id === participant?.id ? '(You)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-[#ffa31a] fill-[#ffa31a]" title="Host" />
                      )}

                      {/* Host Moderation Controls */}
                      {isHost && p.id !== participant?.id && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => hostMuteParticipant(p.id)}
                            className="p-1 rounded text-[#888888] hover:text-[#ffa31a] hover:bg-[#ffa31a]/10 transition-colors"
                            title="Mute participant"
                          >
                            <MicOff className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => hostRemoveParticipant(p.id)}
                            className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Kick participant"
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

        {/* Host Control Center Button (Only for Host) */}
        {isHost && (
          <button
            type="button"
            onClick={onOpenHostControls}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ffa31a]/15 hover:bg-[#ffa31a] border border-[#ffa31a]/50 text-[#ffa31a] hover:text-black text-xs font-black transition-all cursor-pointer shadow-sm"
            title="Open Host Moderation & Controls"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HOST</span>
          </button>
        )}

        {/* Notification / Activity Center Trigger */}
        <button
          type="button"
          onClick={togglePanel}
          className="relative p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-white transition-colors cursor-pointer"
          title="Activity & Notification Center"
        >
          <Bell className="w-4 h-4 text-[#ffa31a]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ffa31a] text-[9px] font-black text-black flex items-center justify-center border-2 border-[#0c0c0c] shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Invite Friends Button */}
        <button
          type="button"
          onClick={onInviteClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-[#ffa31a]/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">INVITE</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-white transition-colors cursor-pointer"
          title={isSoundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#ffa31a]" />}
        </button>
      </div>
    </header>
  );
}
