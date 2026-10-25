import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  MonitorUp,
  LogIn,
  GraduationCap,
  ArrowLeft,
  Volume2,
  BookOpen,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { DeviceSettingsModal } from '../meeting/DeviceSettingsModal.jsx';
import toast from 'react-hot-toast';

export function PreJoinLobby({
  roomCode,
  meetingDetails,
  onJoin,
  isWaitingHost,
  waitingMessage
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Participant naming: use the actual authenticated profile name of student or faculty
  const [name, setName] = useState(user?.name || '');
  const [passcode, setPasscode] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [camPermissionError, setCamPermissionError] = useState(false);

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);

  // Initialize camera and mic preview
  useEffect(() => {
    let active = true;

    async function getPreview() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true
        });

        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Setup audio level meter
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const actx = new AudioContextClass();
          audioContextRef.current = actx;
          const analyser = actx.createAnalyser();
          analyser.fftSize = 64;
          const source = actx.createMediaStreamSource(mediaStream);
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!active) return;
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (err) {
        console.warn('[PreJoinLobby] Camera/mic preview error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          if (err.message?.toLowerCase().includes('audio') || err.constraint === 'audio') {
            setMicPermissionError(true);
          } else {
            setCamPermissionError(true);
          }
        }
      }
    }

    getPreview();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update track enabled state on mute/camera toggles
  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !nextVideoOff;
      });
    }
  };

  const handleJoinClick = async (startPresenting = false) => {
    if (!name.trim()) {
      toast.error('Please enter your full name before joining.');
      return;
    }

    if (meetingDetails?.hasPasscode && meetingDetails?.passcode && passcode !== meetingDetails.passcode) {
      toast.error('Incorrect classroom passcode. Please ask your faculty.');
      return;
    }

    setIsJoining(true);
    try {
      await onJoin({
        name: name.trim(),
        avatar: user?.avatar || '🎓',
        isAudioMuted,
        isVideoOff,
        startPresenting
      });
    } catch (err) {
      setIsJoining(false);
      toast.error(err.message || 'Could not connect to the classroom.');
    }
  };

  const userRole = user?.role || 'student';
  const displaySubject = meetingDetails?.courseCode || meetingDetails?.description || 'Academic Lecture';
  const facultyName = meetingDetails?.hostName || 'Faculty Host';

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Academic Navigation Bar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#1E3A8A] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0] shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1E3A8A] leading-tight">CampusVerse Live</span>
              <span className="text-[10px] text-[#0D9488] font-semibold leading-none">Classroom Lobby</span>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold border border-[#16A34A]/20">
            ● Connection Stable
          </span>
        </div>
      </header>

      {/* Main Classroom Green Room Content */}
      <main className="flex-1 flex items-center justify-center max-w-5xl w-full mx-auto my-6">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Video Preview & Hardware Controls */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video max-w-xl rounded-2xl overflow-hidden bg-[#0F172A] border-2 border-[#E2E8F0] shadow-xl flex items-center justify-center">
              {/* HTML Video Preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  isVideoOff ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />

              {/* Camera Off Avatar state */}
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1E293B] to-[#0F172A] text-white">
                  <div className="w-24 h-24 rounded-full bg-[#1E3A8A] border-2 border-white/20 flex items-center justify-center text-4xl shadow-xl">
                    {user?.avatar || '🎓'}
                  </div>
                  <span className="text-xs font-semibold text-[#94A3B8] mt-3">
                    Camera is switched off
                  </span>
                </div>
              )}

              {/* Top Classroom Info Overlays on Preview */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {!isAudioMuted && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
                    <Volume2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="text-[10px] text-zinc-300">Mic Input:</span>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-[#38BDF8]">
                  CODE: {roomCode}
                </span>
              </div>

              {/* Floating Bottom Controls on Preview */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isAudioMuted
                      ? 'bg-[#DC2626] text-white hover:bg-red-700'
                      : 'bg-white text-[#0F172A] hover:bg-slate-100'
                  }`}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Camera toggle */}
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isVideoOff
                      ? 'bg-[#DC2626] text-white hover:bg-red-700'
                      : 'bg-white text-[#0F172A] hover:bg-slate-100'
                  }`}
                  title={isVideoOff ? 'Enable Camera' : 'Disable Camera'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                {/* Device settings */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 flex items-center justify-center transition-all shadow-md cursor-pointer"
                  title="Test Microphone & Camera Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Permission feedback alerts if blocked */}
            {(camPermissionError || micPermissionError) && (
              <div className="w-full max-w-xl mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {camPermissionError
                    ? 'Camera permission is required. Please check your browser address bar settings.'
                    : 'Microphone permission is required. Please enable audio input in your browser.'}
                </span>
              </div>
            )}

            <p className="text-xs text-[#64748B] mt-3 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              Check your camera preview & test microphone before joining the lecture.
            </p>
          </div>

          {/* Right Column: Classroom Info & Join Card */}
          <div className="md:col-span-5 flex flex-col justify-center">
            {isWaitingHost ? (
              /* Waiting for Faculty Room State */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-lg text-center space-y-4"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-2xl animate-pulse">
                  ⏳
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-bold border border-[#F59E0B]/20">
                    Waiting for Faculty
                  </span>
                  <h3 className="text-lg font-bold text-[#0F172A] mt-2">
                    Waiting Room Active
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                    {waitingMessage ||
                      "Your faculty member has been notified. You will automatically enter as soon as the session begins or you are admitted."}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                  >
                    Cancel and Return to Dashboard
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Join Classroom Form State */
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E2E8F0] shadow-lg space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#1E3A8A]/10 text-[#1E3A8A] text-[11px] font-bold uppercase">
                      Live Classroom
                    </span>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      Code: {roomCode}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    Join Your Classroom
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Enter your class details to connect with your faculty and classmates.
                  </p>
                </div>

                {/* Class Details Card */}
                <div className="p-3.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                      Class / Subject:
                    </span>
                    <span className="font-bold text-[#0F172A] truncate max-w-[170px]">
                      {meetingDetails?.title || 'Academic Lecture'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0D9488]" />
                      Faculty:
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {facultyName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      Your Role:
                    </span>
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0F172A]">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    {user?.name && (
                      <span className="text-[10px] font-bold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        ✓ Verified Account
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(user?.name)}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your official full name"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-[#0F172A] text-sm font-medium transition-all ${
                      user?.name
                        ? 'bg-slate-50 border-[#CBD5E1] cursor-not-allowed text-[#0F172A]'
                        : 'bg-white border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none'
                    }`}
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    {user?.name
                      ? 'Your authenticated university profile name is locked for accurate classroom attendance.'
                      : 'Your name will be visible to your faculty and classmates for attendance.'}
                  </p>
                </div>

                {/* Meeting Passcode (if protected) */}
                {meetingDetails?.hasPasscode && (
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Class Passcode 🔒
                    </label>
                    <input
                      type="text"
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter classroom passcode"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none text-[#0F172A] text-sm"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={() => handleJoinClick(false)}
                    className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isJoining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Join Classroom</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={() => handleJoinClick(true)}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    title="Join with screen share ready"
                  >
                    <MonitorUp className="w-4 h-4 text-[#2563EB]" />
                    <span>Present</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#64748B] max-w-6xl w-full mx-auto pt-4 border-t border-[#E2E8F0]">
        CampusVerse Live Classroom • Secure Academic Video Conferencing • Encrypted WebRTC
      </footer>

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
