import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Crown,
  Shield,
  ShieldAlert,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Volume2,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Check,
  Trash2,
  Users
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export function HostControlsModal({ isOpen, onClose, onOpenEndRoom }) {
  const {
    isHost,
    participants,
    participant,
    roomSettings,
    hostUpdateSettings,
    hostMuteAll,
    hostCameraOffAll,
    hostMuteParticipant,
    hostTurnOffCamera,
    hostRemoveParticipant,
    hostTransferRole
  } = useSocket();

  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !isHost) return null;

  const handleTogglePermission = async (key) => {
    try {
      setIsUpdating(true);
      const newSettings = {
        ...roomSettings,
        [key]: !roomSettings[key]
      };
      await hostUpdateSettings(newSettings);
      toast.success('Room settings updated! 🛡️');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferHost = async (targetId, name) => {
    if (window.confirm(`Transfer HOST privileges to ${name}? You will become a regular participant.`)) {
      hostTransferRole(targetId);
      onClose();
    }
  };

  const otherParticipants = participants.filter((p) => p.id !== participant?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#333333] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#242424] flex items-center justify-between bg-gradient-to-r from-[#181818] via-[#1a1814] to-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffa31a]/20 border border-[#ffa31a]/50 flex items-center justify-center text-[#ffa31a] shadow-inner">
              <Crown className="w-5 h-5 fill-[#ffa31a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  HOST CONTROL CENTER
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ffa31a] text-black uppercase tracking-wider">
                  HOST ONLY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Manage room permissions, joiner restrictions, and moderation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#2e2e2e] border border-[#333333] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: QUICK MASS ACTIONS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#ffa31a]" />
              <span>Quick Meeting Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Mute All Button */}
              <button
                type="button"
                onClick={hostMuteAll}
                className="p-3 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2f2f2f] hover:border-[#ffa31a] flex items-center gap-3 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                  <MicOff className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors">
                    Mute All
                  </p>
                  <p className="text-[10px] text-zinc-500">Mute all joiners</p>
                </div>
              </button>

              {/* Turn Off All Cameras Button */}
              <button
                type="button"
                onClick={hostCameraOffAll}
                className="p-3 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2f2f2f] hover:border-[#ffa31a] flex items-center gap-3 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                  <VideoOff className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors">
                    Stop All Videos
                  </p>
                  <p className="text-[10px] text-zinc-500">Disable joiner cameras</p>
                </div>
              </button>

              {/* Lock / Unlock Meeting */}
              <button
                type="button"
                onClick={() => handleTogglePermission('isLocked')}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all group cursor-pointer ${
                  roomSettings?.isLocked
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-[#1c1c1c] hover:bg-[#252525] border-[#2f2f2f] hover:border-[#ffa31a]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    roomSettings?.isLocked
                      ? 'bg-amber-500/20 border-amber-500/50 text-[#ffa31a]'
                      : 'bg-[#252525] border-[#383838] text-zinc-300'
                  }`}
                >
                  {roomSettings?.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors">
                    {roomSettings?.isLocked ? 'Room Locked' : 'Lock Meeting'}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {roomSettings?.isLocked ? 'No new joins allowed' : 'Prevent new entries'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: JOINER PERMISSION TOGGLES */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ffa31a]" />
              <span>Joiner Permissions & Room Policy</span>
            </h3>

            <div className="p-3 sm:p-4 rounded-xl bg-[#181818] border border-[#2b2b2b] divide-y divide-[#262626]">
              {/* Permission 1: Screen Sharing */}
              <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222222] text-[#ffa31a] flex items-center justify-center">
                    <MonitorUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Allow Screen Sharing</p>
                    <p className="text-[10px] text-zinc-500">
                      Permit participants to share their computer screen
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTogglePermission('allowJoinerScreenShare')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    roomSettings?.allowJoinerScreenShare ? 'bg-[#ffa31a]' : 'bg-[#333333]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      roomSettings?.allowJoinerScreenShare ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Permission 2: Live Chat */}
              <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222222] text-[#ffa31a] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Allow Live Chat</p>
                    <p className="text-[10px] text-zinc-500">
                      Permit participants to send text and media messages in chat
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTogglePermission('allowJoinerChat')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    roomSettings?.allowJoinerChat ? 'bg-[#ffa31a]' : 'bg-[#333333]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      roomSettings?.allowJoinerChat ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Permission 3: Soundboard */}
              <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222222] text-[#ffa31a] flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Allow Soundboard</p>
                    <p className="text-[10px] text-zinc-500">
                      Permit participants to trigger and upload sound effects
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTogglePermission('allowJoinerSoundboard')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    roomSettings?.allowJoinerSoundboard ? 'bg-[#ffa31a]' : 'bg-[#333333]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      roomSettings?.allowJoinerSoundboard ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Permission 4: Unmute Self */}
              <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222222] text-[#ffa31a] flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Allow Participants to Unmute</p>
                    <p className="text-[10px] text-zinc-500">
                      If disabled, participants cannot unmute their mic once muted
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTogglePermission('allowJoinerUnmute')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    roomSettings?.allowJoinerUnmute ? 'bg-[#ffa31a]' : 'bg-[#333333]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      roomSettings?.allowJoinerUnmute ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: PARTICIPANT MODERATION ROSTER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#ffa31a]" />
                <span>Participants ({participants.length})</span>
              </h3>
              <span className="text-[10px] text-zinc-500">Control individual participants</span>
            </div>

            <div className="space-y-2">
              {participants.map((p) => {
                const isSelf = p.id === participant?.id;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#191919] border border-[#2b2b2b] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{p.avatar || '🔥'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          {p.isHost && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ffa31a] text-black text-[9px] font-black uppercase">
                              HOST
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[10px] text-zinc-500 font-semibold">(You)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                          <span>{p.isMuted ? '🔇 Muted' : '🎤 Mic On'}</span>
                          <span>•</span>
                          <span>{p.isCameraOff ? '📷 Off' : '📹 Cam On'}</span>
                          {p.isScreenSharing && (
                            <>
                              <span>•</span>
                              <span className="text-[#ffa31a]">🖥️ Sharing Screen</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (only for other participants) */}
                    {!isSelf && (
                      <div className="flex items-center gap-1">
                        {/* Mute */}
                        <button
                          type="button"
                          onClick={() => hostMuteParticipant(p.id)}
                          className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#ffa31a]/20 text-zinc-400 hover:text-[#ffa31a] transition-colors cursor-pointer"
                          title="Mute Participant"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                        </button>

                        {/* Turn off camera */}
                        <button
                          type="button"
                          onClick={() => hostTurnOffCamera(p.id)}
                          className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#ffa31a]/20 text-zinc-400 hover:text-[#ffa31a] transition-colors cursor-pointer"
                          title="Turn Off Camera"
                        >
                          <VideoOff className="w-3.5 h-3.5" />
                        </button>

                        {/* Make Host */}
                        <button
                          type="button"
                          onClick={() => handleTransferHost(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#ffa31a]/20 text-zinc-400 hover:text-[#ffa31a] transition-colors cursor-pointer"
                          title="Transfer Host Privileges"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>

                        {/* Kick / Remove */}
                        <button
                          type="button"
                          onClick={() => hostRemoveParticipant(p.id)}
                          className="p-1.5 rounded-lg bg-[#252525] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Kick from Meeting"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: End Meeting for All */}
        <div className="p-4 border-t border-[#242424] bg-[#181818]/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenEndRoom}
            className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>End Kalesh for Everyone</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs transition-colors shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
