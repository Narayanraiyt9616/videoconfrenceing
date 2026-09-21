import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export function SoundboardBanner() {
  const { activeSoundEffect } = useSocket();

  return (
    <AnimatePresence>
      {activeSoundEffect && (
        <motion.div
          key={activeSoundEffect.timestamp}
          initial={{ opacity: 0, y: -25, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#161616]/95 border border-[#ffa31a]/50 shadow-[0_0_30px_rgba(255,163,26,0.35)] backdrop-blur-xl">
            {/* Player Avatar */}
            <div className="w-9 h-9 rounded-xl bg-[#222222] border border-[#3a3a3a] flex items-center justify-center text-lg shadow-inner">
              {activeSoundEffect.playedBy?.avatar || '🔥'}
            </div>

            {/* Content Text */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#ffa31a] uppercase tracking-wider">
                  SOUNDBOARD
                </span>
                <span className="text-[11px] text-zinc-400">•</span>
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {activeSoundEffect.playedBy?.name || 'Someone'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeSoundEffect.soundEmoji || '🔊'}</span>
                <span className="text-sm font-black text-white tracking-wide">
                  {activeSoundEffect.soundName}
                </span>
              </div>
            </div>

            {/* Animated Soundwave Graphic */}
            <div className="flex items-center gap-1 pl-2 border-l border-[#2e2e2e] h-7">
              <span className="w-1 bg-[#ffa31a] rounded-full animate-soundwave-1" />
              <span className="w-1 bg-[#ffa31a] rounded-full animate-soundwave-2" />
              <span className="w-1 bg-[#ffa31a] rounded-full animate-soundwave-3" />
              <span className="w-1 bg-[#ffa31a] rounded-full animate-soundwave-4" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
