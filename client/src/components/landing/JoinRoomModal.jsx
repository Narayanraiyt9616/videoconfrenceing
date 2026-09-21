import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogIn, X, Key, AlertTriangle, Check, Users, Crown, RefreshCw } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { AVATAR_OPTIONS } from '../../utils/avatars.js';
import { normalizeRoomCode, isValidRoomCode } from '../../utils/roomUtils.js';
import toast from 'react-hot-toast';

export function JoinRoomModal({ isOpen, initialCode = '', onClose, onJoinSuccess }) {
  const { checkRoom, joinRoom, knockRoom } = useSocket();

  const [step, setStep] = useState('form'); // 'form' | 'knocking' | 'rejected' | 'not_found' | 'full'
  const [rejectReason, setRejectReason] = useState('');
  const [roomCode, setRoomCode] = useState(normalizeRoomCode(initialCode) || initialCode);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😂');
  const [loading, setLoading] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState(null); // null | 'valid' | 'invalid' | 'unreachable'
  const [verifiedRoom, setVerifiedRoom] = useState(null);

  const debounceTimerRef = useRef(null);

  // Pre-fill from sessionStorage if user previously set their name/avatar
  useEffect(() => {
    const savedName = sessionStorage.getItem('kalesh_userName');
    const savedAvatar = sessionStorage.getItem('kalesh_avatar');
    if (savedName) setName(savedName);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const validateCode = useCallback(async (codeToTest, isSubmitting = false) => {
    const clean = normalizeRoomCode(codeToTest);
    if (!clean || !isValidRoomCode(clean)) {
      setVerifiedRoom(null);
      setCodeStatus(null);
      if (isSubmitting) {
        toast.error('Please enter a valid room code (e.g. KAL-8X92)');
      }
      return { valid: false };
    }

    setCheckingCode(true);
    try {
      const res = await checkRoom(clean);
      if (res?.exists) {
        setVerifiedRoom(res.room);
        setCodeStatus('valid');
        if (res.room.isFull && isSubmitting) {
          setStep('full');
        }
        return { valid: true, room: res.room, isFull: res.room.isFull };
      } else if (res?.unreachable) {
        setCodeStatus('unreachable');
        return { valid: false, unreachable: true };
      } else {
        setVerifiedRoom(null);
        setCodeStatus('invalid');
        if (isSubmitting) {
          setStep('not_found');
        }
        return { valid: false, notFound: true };
      }
    } catch {
      setVerifiedRoom(null);
      setCodeStatus('unreachable');
      return { valid: false, unreachable: true };
    } finally {
      setCheckingCode(false);
    }
  }, [checkRoom]);

  // Sync when initialCode changes (e.g. from invite link)
  useEffect(() => {
    if (initialCode) {
      const clean = normalizeRoomCode(initialCode);
      setRoomCode(clean);
      if (isValidRoomCode(clean)) {
        validateCode(clean, false);
      }
    }
  }, [initialCode, validateCode]);

  // Reset or re-validate on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setRejectReason('');
      setLoading(false);
      if (initialCode) {
        const clean = normalizeRoomCode(initialCode);
        setRoomCode(clean);
        if (isValidRoomCode(clean)) {
          validateCode(clean, false);
        }
      }
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    }
  }, [isOpen, initialCode, validateCode]);

  // Debounced non-destructive background validation when roomCode changes
  const handleRoomCodeChange = (e) => {
    const raw = e.target.value;
    // Auto-normalize if user pastes a URL or long string containing the code
    const normalized = normalizeRoomCode(raw);
    const valueToSet = (raw.includes('/') || raw.includes('?') || raw.length > 8)
      ? normalized
      : raw.toUpperCase();

    setRoomCode(valueToSet);
    setCodeStatus(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const testCode = normalizeRoomCode(valueToSet);
    if (isValidRoomCode(testCode)) {
      debounceTimerRef.current = setTimeout(() => {
        validateCode(testCode, false);
      }, 350);
    } else {
      setVerifiedRoom(null);
    }
  };

  const handleRoomCodeBlur = () => {
    const clean = normalizeRoomCode(roomCode);
    if (clean && clean !== roomCode) {
      setRoomCode(clean);
      if (isValidRoomCode(clean)) {
        validateCode(clean, false);
      }
    }
  };

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanCode = normalizeRoomCode(roomCode);

    if (!cleanCode || !isValidRoomCode(cleanCode)) {
      toast.error('Please enter a valid room code (e.g. KAL-8X92)!');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your display name!');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if room exists in ephemeral RAM
      let check = await validateCode(cleanCode, true);

      // If server is cold-starting / unreachable on Render, retry once automatically
      if (check.unreachable) {
        toast('Waking up server on Render, retrying in a second...', { icon: '⏳' });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        check = await validateCode(cleanCode, true);
      }

      if (!check.valid) {
        if (check.unreachable) {
          toast.error('Server is still starting up. Please give it 10-15 seconds and try again!');
        }
        setLoading(false);
        return;
      }

      if (check.isFull) {
        setStep('full');
        setLoading(false);
        return;
      }

      // Check if user was original host
      const storedHostToken = sessionStorage.getItem(`kalesh_host_${cleanCode}`);
      const isHost = Boolean(storedHostToken);

      sessionStorage.setItem('kalesh_userName', name.trim());
      sessionStorage.setItem('kalesh_avatar', avatar);

      // 2. If not host, require Host Approval (Door Knocking)
      if (!isHost) {
        setStep('knocking');
        try {
          await knockRoom({
            roomCode: cleanCode,
            name: name.trim(),
            avatar
          });
          toast.success('Host approved your entry! Welcome to the meeting.', { icon: '🎉' });
        } catch (knockErr) {
          setRejectReason(knockErr.message || 'Host declined entry to this meeting.');
          setStep('rejected');
          setLoading(false);
          return;
        }
      }

      // 3. Join via Socket.IO
      await joinRoom({
        roomCode: cleanCode,
        name: name.trim(),
        avatar,
        isHost,
        hostToken: storedHostToken
      });

      onJoinSuccess(cleanCode);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error joining meeting room');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const storedHostToken = sessionStorage.getItem(`kalesh_host_${normalizeRoomCode(roomCode)}`);
  const isRecognizedHost = Boolean(storedHostToken);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#2e2e2e] shadow-2xl relative overflow-hidden text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#888888] hover:text-white p-1.5 rounded-full hover:bg-[#252525] transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-xl font-black text-white">KALESH</span>
              <span className="bg-[#ffa31a] text-black text-xs px-2 py-0.5 rounded font-black tracking-tight">
                JOIN MEETING
              </span>
            </div>

            {/* Verified Room Info Banner */}
            {verifiedRoom && (
              <div className="mb-4 p-3 rounded-xl bg-[#1c1a14] border border-[#ffa31a]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div>
                    <span className="font-extrabold text-white block">{verifiedRoom.name}</span>
                    <span className="text-[#888888] text-[11px]">Room is active and online</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-[#333] text-[#ffa31a] font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{verifiedRoom.participantsCount} / {verifiedRoom.maxParticipants}</span>
                </div>
              </div>
            )}

            {isRecognizedHost && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/40 flex items-center gap-2 text-xs text-[#ffa31a] font-bold">
                <Crown className="w-4 h-4 fill-[#ffa31a]" />
                <span>Host session detected for this room! You will rejoin with host privileges.</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              {/* Room Code */}
              <div>
                <label className="block text-xs font-bold text-[#b5b5b5] uppercase tracking-wider mb-1.5">
                  Meeting Code <span className="text-[#ffa31a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. KAL-8X92 or 8X92"
                    value={roomCode}
                    onChange={handleRoomCodeChange}
                    onBlur={handleRoomCodeBlur}
                    className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border border-[#333333] focus:border-[#ffa31a] text-base font-mono font-bold tracking-widest text-[#ffa31a] uppercase focus:outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {checkingCode && <RefreshCw className="w-4 h-4 text-[#ffa31a] animate-spin" />}
                    <Key className="w-4 h-4 text-[#666666]" />
                  </div>
                </div>

                {/* Inline non-destructive status feedback */}
                {codeStatus === 'valid' && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Room found and online
                  </p>
                )}
                {codeStatus === 'unreachable' && (
                  <p className="text-[11px] text-sky-400 mt-1.5 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Server is waking up on Render. You can still knock to join.
                  </p>
                )}
                {codeStatus === 'invalid' && isValidRoomCode(normalizeRoomCode(roomCode)) && (
                  <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Room not found on server or may have expired.
                  </p>
                )}
              </div>

              {/* Your Name */}
              <div>
                <label className="block text-xs font-bold text-[#b5b5b5] uppercase tracking-wider mb-1.5">
                  Your Display Name <span className="text-[#ffa31a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="e.g. Rahul, Priya, Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border border-[#333333] focus:border-[#ffa31a] text-sm font-semibold text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Choose Avatar */}
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
                      className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        avatar === item.emoji
                          ? 'bg-[#ffa31a] text-black scale-110 shadow-md shadow-[#ffa31a]/30 font-bold'
                          : 'hover:bg-[#222222]'
                      }`}
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || checkingCode}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wide bg-[#ffa31a] hover:bg-[#ff9000] text-black shadow-lg shadow-[#ffa31a]/25 hover:shadow-[#ffa31a]/40 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <span>CONNECTING TO ROOM...</span>
                ) : isRecognizedHost ? (
                  <>
                    <Crown className="w-4 h-4 fill-black" />
                    <span>REJOIN AS HOST 👑</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>KNOCK TO JOIN ROOM 🚪</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : step === 'not_found' ? (
          /* Meeting Not Found Error State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Meeting Not Found</h3>
            <p className="text-xs text-[#b5b5b5] max-w-sm mx-auto mb-6 leading-relaxed">
              The meeting room code <strong className="text-[#ffa31a] font-mono">{normalizeRoomCode(roomCode) || roomCode}</strong> was not found or has expired. Please check the code or ask the host for a new link.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Edit Code / Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : step === 'full' ? (
          /* Room Full Error State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <Users className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Meeting Room Full</h3>
            <p className="text-xs text-[#b5b5b5] max-w-sm mx-auto mb-6 leading-relaxed">
              Meeting <strong className="text-[#ffa31a] font-mono">{normalizeRoomCode(roomCode) || roomCode}</strong> has reached its maximum participant capacity.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : step === 'knocking' ? (
          /* Waiting Room State */
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-[#ffa31a]/20 border-2 border-[#ffa31a] flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl shadow-[#ffa31a]/20 animate-pulse">
              🚪
            </div>

            <h3 className="text-2xl font-black text-white mb-2">
              Knocking on Door...
            </h3>
            <p className="text-xs text-[#b5b5b5] max-w-sm mx-auto mb-6 leading-relaxed">
              Knocking on room <strong className="text-[#ffa31a] font-mono">{normalizeRoomCode(roomCode) || roomCode}</strong>.
              <br />
              <span className="text-[#888888] mt-1 block">
                The meeting host will let you in shortly.
              </span>
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffa31a]/15 border border-[#ffa31a]/30">
              <span className="w-2 h-2 rounded-full bg-[#ffa31a] animate-ping" />
              <span className="text-xs font-bold text-[#ffa31a] uppercase tracking-wider">
                Waiting for Host Approval...
              </span>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs text-[#888888] hover:text-white underline transition-colors cursor-pointer"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        ) : (
          /* Rejection State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Entry Declined</h3>
            <p className="text-xs text-[#b5b5b5] mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
              {rejectReason || 'Host declined entry to this meeting.'}
            </p>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="px-6 py-2.5 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
