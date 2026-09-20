import React from 'react';
import { motion } from 'framer-motion';

const FLOATING_TAGS = [
  { text: 'HD 1080p', x: '10%', y: '18%', duration: 9, delay: 0 },
  { text: 'VERIFIED', x: '82%', y: '14%', duration: 11, delay: 1 },
  { text: 'LIVE STREAM', x: '76%', y: '70%', duration: 10, delay: 0.5 },
  { text: '100% RAM ONLY', x: '12%', y: '78%', duration: 12, delay: 2 },
  { text: 'TOP RATED 🔥', x: '46%', y: '88%', duration: 8, delay: 1.5 },
  { text: 'ZERO DATABASE', x: '86%', y: '42%', duration: 10.5, delay: 0.2 },
  { text: 'NEWEST', x: '25%', y: '12%', duration: 9.5, delay: 3 },
  { text: 'TRENDING #1', x: '6%', y: '48%', duration: 11.5, delay: 1.2 }
];

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0a0a0a]">
      {/* Subtle Warm Amber / Charcoal Ambient Glows */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-[#ffa31a]/10 blur-[130px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#ff7700]/8 blur-[140px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full bg-[#ffa31a]/8 blur-[120px]"
      />

      {/* Subtle Dark Studio Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Category Pills */}
      {FLOATING_TAGS.map((item, idx) => (
        <motion.div
          key={idx}
          style={{ left: item.x, top: item.y }}
          animate={{
            y: ['-10px', '10px', '-10px'],
            opacity: [0.25, 0.55, 0.25]
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: item.delay
          }}
          className="absolute text-[11px] font-bold px-2.5 py-1 rounded bg-[#1c1c1c]/80 border border-[#333333] text-[#ffa31a] select-none shadow-md tracking-wider"
        >
          {item.text}
        </motion.div>
      ))}
    </div>
  );
}
