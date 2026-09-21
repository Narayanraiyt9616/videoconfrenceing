import React, { useEffect, useRef, memo } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, MonitorUp, Volume2, Wand2 } from 'lucide-react';
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
        // Autoplay may need user gesture
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
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-[#121212] border transition-all duration-300 flex items-center justify-center select-none shadow-lg ${
        isActuallySpeaking
          ? 'border-[#ffa31a] shadow-[0_0_25px_rgba(255,163,26,0.4)] ring-2 ring-[#ffa31a]'
          : 'border-[#262626] hover:border-[#3a3a3a]'
      } ${isFeatured ? 'ring-2 ring-[#ffa31a]/60' : ''}`}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#161616] to-[#0f0f0f] p-4">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.45, repeat: isSpeaking ? Infinity : 0 }}
            className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-3xl sm:text-5xl border transition-all duration-200 ${
              isSpeaking
                ? 'border-[#ffa31a] bg-[#ffa31a]/20 shadow-[0_0_30px_rgba(255,163,26,0.4)]'
                : 'border-[#333333] bg-[#202020]'
            }`}
          >
            {participant?.avatar || '🔥'}
          </motion.div>
          <span className="text-[10px] font-bold text-[#888888] mt-3 uppercase tracking-widest">
            CAMERA OFF
          </span>
        </div>
      )}

      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20 pointer-events-none">
        {participant?.isHost && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#ffa31a] text-black shadow-sm">
            <Crown className="w-3 h-3 fill-black" />
            <span>HOST</span>
          </div>
        )}
        {isScreenSharing && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#252525] border border-[#3e3e3e] text-[#ffa31a] shadow-sm">
            <MonitorUp className="w-3 h-3 text-[#ffa31a]" />
            <span>SCREEN</span>
          </div>
        )}
        {activeFilter !== 'none' && !isCameraOff && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-sm backdrop-blur-sm">
            <Wand2 className="w-3 h-3 text-purple-400" />
            <span className="uppercase tracking-wider">{activeFilter}</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ffa31a] text-black shadow-md">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>SPEAKING</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Name Tag & Status Indicators */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        {/* Name Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-[#333333] max-w-[75%] backdrop-blur-md shadow-md">
          <span className="text-xs">{participant?.avatar || '🔥'}</span>
          <span className="text-xs font-bold text-white truncate">
            {participant?.name || 'Friend'} {isLocal && '(You)'}
          </span>
        </div>

        {/* Hardware Status Badges */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all ${
              isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : isSpeaking
                ? 'bg-[#ffa31a] border-[#ffa31a] text-black shadow-md shadow-[#ffa31a]/40 font-bold'
                : 'bg-black/80 border-[#333333] text-[#ffa31a]'
            }`}
            title={isMuted ? 'Muted' : 'Mic Active'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </div>

          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all ${
              isCameraOff
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-black/80 border-[#333333] text-white'
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
