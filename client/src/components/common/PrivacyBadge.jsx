import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PrivacyBadge() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block font-sans">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#181818] border border-[#2e2e2e] text-zinc-300 hover:text-white hover:border-[#ffa31a] transition-all cursor-pointer shadow-sm"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#ffa31a]" />
        <span>100% EPHEMERAL</span>
        <Info className="w-3 h-3 text-zinc-500" />
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3.5 rounded-xl bg-[#141414] border border-[#2e2e2e] text-xs text-zinc-300 shadow-2xl z-50 pointer-events-none"
          >
            <div className="font-extrabold text-[#ffa31a] flex items-center gap-1.5 mb-1.5">
              <span>🔒 Zero Database • RAM Only</span>
            </div>
            <p className="leading-relaxed text-[11px] text-zinc-400">
              All room data exists <strong>strictly in volatile server RAM</strong>. Media, chat logs, polls, and video streams are shredded the instant the room ends.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
