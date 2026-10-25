import React, { useEffect, useRef, memo } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, MonitorUp, Volume2, Wand2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export const VideoCard = memo(function VideoCard({
  stream,
  participant,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
  isSpeaking = false,
  isFeatured = false,
  videoFilter = null
}) {
  const videoRef = useRef(null);
  const shouldMute = Boolean(isLocal || isMuted);
  const isActuallySpeaking = Boolean(isSpeaking && !isMuted);

  // Bind media stream to HTML <video> tag & ensure playback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = shouldMute;

    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch((err) => {
        console.warn('[VideoCard] Autoplay interrupted:', err);
      });
    }
  }, [stream, shouldMute]);

  // Dynamically ensure HTML video element muted property strictly tracks shouldMute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = shouldMute;
    }
  }, [shouldMute]);

  // For remote streams, also explicitly enable/disable audio tracks based on isMuted state
  useEffect(() => {
    if (!isLocal && stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isLocal, stream, isMuted]);

  const activeFilter = videoFilter || participant?.videoFilter || 'none';
  const filterClass = `filter-${activeFilter}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-[#0F172A] border transition-all duration-300 flex items-center justify-center select-none shadow-md ${
        isActuallySpeaking
          ? 'border-[#2563EB] shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-2 ring-[#2563EB]'
          : 'border-[#334155] hover:border-[#64748B]'
      } ${isFeatured ? 'ring-2 ring-[#0D9488]' : ''}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={shouldMute}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''
        } ${isCameraOff ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${filterClass}`}
      />

      {/* Camera Off Avatar State */}
      {isCameraOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1E293B] to-[#0F172A] p-4 text-white">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.45, repeat: isSpeaking ? Infinity : 0 }}
            className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-3xl sm:text-5xl border transition-all duration-200 ${
              isSpeaking
                ? 'border-[#2563EB] bg-[#2563EB]/20 shadow-[0_0_25px_rgba(37,99,235,0.5)]'
                : 'border-[#334155] bg-[#1E293B]'
            }`}
          >
            {participant?.avatar || '🎓'}
          </motion.div>
          <span className="text-[10px] font-bold text-[#94A3B8] mt-3 uppercase tracking-wider">
            Camera Off
          </span>
        </div>
      )}

      {/* Top Academic Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20 pointer-events-none">
        {participant?.isHost && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1E3A8A] text-white shadow-xs border border-blue-400/30">
            <Crown className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
            <span>FACULTY</span>
          </div>
        )}
        {isScreenSharing && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0D9488] text-white shadow-xs">
            <MonitorUp className="w-3 h-3 text-white" />
            <span>PRESENTING</span>
          </div>
        )}
        {activeFilter !== 'none' && !isCameraOff && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-xs backdrop-blur-xs">
            <Wand2 className="w-3 h-3 text-purple-400" />
            <span className="uppercase tracking-wider">{activeFilter}</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2563EB] text-white shadow-sm">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>SPEAKING</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Name Tag & Hardware Status Indicators */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        {/* Name Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 border border-white/15 max-w-[75%] backdrop-blur-xs shadow-md">
          <span className="text-xs">{participant?.avatar || '🎓'}</span>
          <span className="text-xs font-bold text-white truncate">
            {participant?.name || 'Class Participant'} {isLocal && '(You)'}
          </span>
        </div>

        {/* Hardware Status Badges */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-xs border transition-all ${
              isMuted
                ? 'bg-[#DC2626] border-red-500 text-white shadow-xs'
                : isSpeaking
                ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm'
                : 'bg-black/70 border-white/15 text-slate-300'
            }`}
            title={isMuted ? 'Microphone Muted' : 'Microphone Active'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </div>

          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-xs border transition-all ${
              isCameraOff
                ? 'bg-[#DC2626] border-red-500 text-white shadow-xs'
                : 'bg-black/70 border-white/15 text-white'
            }`}
            title={isCameraOff ? 'Camera Off' : 'Camera On'}
          >
            {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
