import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.jsx';

export function FloatingReactions() {
  const { floatingReactions } = useSocket();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {floatingReactions.map((reaction, index) => {
          // Generate pseudo-random trajectory parameters based on reaction id or index
          const randomX = ((reaction.id.charCodeAt(0) * 17) % 80) + 10; // 10% to 90%
          const randomRotate = ((reaction.id.charCodeAt(1) || 5) % 40) - 20; // -20deg to +20deg
          const randomDrift = ((reaction.id.charCodeAt(2) || 3) % 60) - 30; // -30px to +30px

          return (
            <motion.div
              key={reaction.id || index}
              initial={{
                opacity: 0,
                scale: 0.5,
                y: '100vh',
                x: `${randomX}vw`,
                rotate: 0
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.3, 1.1, 0.9],
                y: '-10vh',
                x: `calc(${randomX}vw + ${randomDrift}px)`,
                rotate: randomRotate
              }}
              transition={{
                duration: 3.5,
                ease: 'easeOut',
                times: [0, 0.15, 0.75, 1]
              }}
              className="absolute flex flex-col items-center select-none"
            >
              <span className="text-4xl sm:text-5xl filter drop-shadow-[0_0_12px_rgba(255,75,31,0.5)]">
                {reaction.emoji}
              </span>
              {reaction.fromName && (
                <span className="text-[10px] font-semibold px-2 py-0.5 mt-1 rounded-full bg-dark-900/80 text-slate-300 border border-white/10 backdrop-blur-sm">
                  {reaction.fromName}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
