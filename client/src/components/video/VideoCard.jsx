import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, MonitorUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function VideoCard({
  stream,
  participant,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false
}) {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Bind media stream to HTML <video> tag & ensure autoplay
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('[VideoCard] Autoplay interrupted:', err);
      });
    }
  }, [stream]);

  // Audio level analysis for active speaker detection
  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let javascriptNode = null;
    let isCancelled = false;

    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.8;
          analyser.fftSize = 1024;

          microphone.connect(analyser);
          analyser.connect(javascriptNode);
          javascriptNode.connect(audioContext.destination);

          javascriptNode.onaudioprocess = () => {
            if (isCancelled) return;
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
              values += array[i];
            }
            const average = values / length;
            setIsSpeaking(average > 18);
          };
        }
      }
    } catch {
      // Audio context might be restricted
    }

    return () => {
      isCancelled = true;
      if (javascriptNode) javascriptNode.disconnect();
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [stream, isMuted]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative w-full h-full min-h-[170px] sm:min-h-[230px] rounded-xl overflow-hidden bg-[#121212] border transition-all duration-200 flex items-center justify-center ${
        isSpeaking
          ? 'border-[#ffa31a] shadow-[0_0_20px_rgba(255,163,26,0.4)] ring-2 ring-[#ffa31a]/40'
          : 'border-[#282828] hover:border-[#3d3d3d]'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''
        } ${isCameraOff ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />

      {/* Camera Off Avatar State */}
      {isCameraOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151515] p-4">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl border transition-all ${
              isSpeaking
                ? 'border-[#ffa31a] bg-[#ffa31a]/20 shadow-[0_0_25px_rgba(255,163,26,0.35)]'
                : 'border-[#333333] bg-[#222222]'
            }`}
          >
            {participant?.avatar || '🔥'}
          </motion.div>
          <span className="text-[11px] font-bold text-[#888888] mt-3 uppercase tracking-wider">
            CAMERA OFF
          </span>
        </div>
      )}

      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
        {participant?.isHost && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-[#ffa31a] text-black">
            <Crown className="w-3 h-3 fill-black" />
            <span>HOST</span>
          </div>
        )}
        {isScreenSharing && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#333333] text-white">
            <MonitorUp className="w-3 h-3 text-[#ffa31a]" />
            <span>SHARING</span>
          </div>
        )}
        <div className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-black/70 text-[#ffa31a] border border-[#333333]">
          HD
        </div>
      </div>

      {/* Bottom Identity & Hardware Badges */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        {/* Name Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-[#333333] max-w-[70%] backdrop-blur-sm">
          <span className="text-sm">{participant?.avatar || '🔥'}</span>
          <span className="text-xs font-bold text-white truncate">
            {participant?.name || 'Friend'} {isLocal && '(You)'}
          </span>
        </div>

        {/* Mic & Cam Icons */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm border ${
              isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : isSpeaking
                ? 'bg-[#ffa31a] border-[#ffa31a] text-black shadow-md shadow-[#ffa31a]/40 font-bold'
                : 'bg-black/80 border-[#333333] text-[#ffa31a]'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </div>

          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm border ${
              isCameraOff
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-black/80 border-[#333333] text-white'
            }`}
          >
            {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
