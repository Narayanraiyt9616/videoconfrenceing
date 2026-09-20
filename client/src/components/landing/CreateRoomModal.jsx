import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, ArrowRight, ShieldCheck, Users, RotateCcw, Video, Play, Lock } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { AVATAR_OPTIONS } from '../../utils/avatars.js';
import toast from 'react-hot-toast';

export function CreateRoomModal({ isOpen, onClose, onRoomReady }) {
  const { createRoom, joinRoom, generateNewCode } = useSocket();

  const [step, setStep] = useState('form'); // 'form' | 'created'
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [avatar, setAvatar] = useState('🔥');
  const [previewCode, setPreviewCode] = useState('');
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [createdRoomData, setCreatedRoomData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleRefreshCode();
    }
  }, [isOpen]);

  const handleRefreshCode = async () => {
    setIsRefreshingCode(true);
    try {
      const fresh = await generateNewCode();
      setPreviewCode(fresh);
    } catch {
      setPreviewCode('KAL-' + Math.random().toString(36).substring(2, 6).toUpperCase());
    } finally {
      setIsRefreshingCode(false);
    }
  };

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Bhai apna naam toh daalo pehle! 🔥');
      return;
    }

    setLoading(true);
    try {
      const data = await createRoom({
        roomName: roomName.trim() || `${name}'s Kalesh Room 🔥`,
        maxParticipants,
        customRoomCode: previewCode || null
      });

      sessionStorage.setItem(`kalesh_host_${data.roomCode}`, data.hostToken);
      sessionStorage.setItem('kalesh_userName', name.trim());
      sessionStorage.setItem('kalesh_avatar', avatar);

      setCreatedRoomData(data);
      setStep('created');
    } catch (err) {
      toast.error(err.message || 'Room creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdRoomData) return;
    navigator.clipboard.writeText(createdRoomData.roomCode);
    setCopiedCode(true);
    toast.success('Room code copied! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!createdRoomData) return;
    const inviteUrl = `${window.location.origin}/join/${createdRoomData.roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success('Invite link copied! 🔗');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEnterRoom = async () => {
    if (!createdRoomData) return;
    setLoading(true);
    try {
      await joinRoom({
        roomCode: createdRoomData.roomCode,
        name: name.trim(),
        avatar,
        isHost: true,
        hostToken: createdRoomData.hostToken
      });
      onRoomReady(createdRoomData.roomCode);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not enter room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#2e2e2e] shadow-2xl relative overflow-hidden text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#888888] hover:text-white p-1 rounded-full hover:bg-[#252525] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-xl font-black text-white">KALESH</span>
              <span className="bg-[#ffa31a] text-black text-xs px-2 py-0.5 rounded font-black tracking-tight">
                CREATE
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-[#b5b5b5] uppercase tracking-wider mb-1.5">
                  Your Display Name <span className="text-[#ffa31a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="e.g. Rahul 🔥 or Priya 💀"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border border-[#333333] focus:border-[#ffa31a] text-sm font-semibold text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-[#b5b5b5] uppercase tracking-wider mb-1.5">
                  Choose Temporary Avatar
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a]">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => setAvatar(item.emoji)}
                      className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all ${
                        avatar === item.emoji
                          ? 'bg-[#ffa31a] text-black scale-110 shadow-md shadow-[#ffa31a]/30'
                          : 'hover:bg-[#222222]'
                      }`}
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Name */}
              <div>
                <label className="block text-xs font-bold text-[#b5b5b5] uppercase tracking-wider mb-1.5">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  maxLength={35}
                  placeholder="e.g. Hostel Late Night Bakchodi"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border border-[#333333] focus:border-[#ffa31a] text-sm font-semibold text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Participant Capacity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#b5b5b5] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#ffa31a]" />
                    <span>Max Participants</span>
                  </label>
                  <span className="text-xs font-bold text-[#ffa31a] px-2 py-0.5 rounded bg-[#ffa31a]/15 border border-[#ffa31a]/30">
                    {maxParticipants} FRIENDS
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full accent-[#ffa31a] cursor-pointer"
                />
              </div>

              {/* Auto Generated Room Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#b5b5b5] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#ffa31a]" />
                    <span>Assigned Room Code</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshCode}
                    disabled={isRefreshingCode}
                    className="text-xs text-[#ffa31a] hover:text-white flex items-center gap-1 font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingCode ? 'animate-spin' : ''}`} />
                    <span>Refresh Code</span>
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0e0e0e] border border-[#2f2f2f] font-mono font-bold text-sm text-[#ffa31a]">
                  <span className="tracking-widest">{previewCode || 'GENERATING...'}</span>
                  <span className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold font-sans">
                    100% UNIQUE
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wide bg-[#ffa31a] hover:bg-[#ff9000] text-black shadow-lg shadow-[#ffa31a]/25 hover:shadow-[#ffa31a]/40 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
              >
                {loading ? (
                  <span>CREATING ROOM...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>CREATE KALESH ROOM</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Room Ready */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#ffa31a]/20 border border-[#ffa31a] text-[#ffa31a] flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              Room Ready 🔥
            </h3>
            <p className="text-xs text-[#999999] mb-6">
              Invite friends using code or link to start the hangout.
            </p>

            {/* Room Code Box */}
            <div className="p-5 rounded-xl bg-[#0e0e0e] border border-[#2a2a2a] mb-5">
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block mb-1">
                ROOM CODE
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-wider text-[#ffa31a] select-all font-mono">
                {createdRoomData?.roomCode}
              </div>
            </div>

            {/* Copy Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-3 px-3 rounded-lg font-bold text-xs bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-[#ffa31a]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'COPIED!' : 'COPY CODE'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-3 rounded-lg font-bold text-xs bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#ffa31a]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'COPIED!' : 'COPY LINK'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleEnterRoom}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wide bg-[#ffa31a] hover:bg-[#ff9000] text-black shadow-lg shadow-[#ffa31a]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>ENTER ROOM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
