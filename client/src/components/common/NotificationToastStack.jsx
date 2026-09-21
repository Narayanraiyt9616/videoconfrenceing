import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Flame, MessageCircle, HelpCircle, Bell, UserPlus, LogOut } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';

export function NotificationToastStack() {
  const { activeToasts, dismissToast, openPanel } = useNotifications();

  if (activeToasts.length === 0) return null;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'dare':
        return {
          border: 'border-red-500/50',
          badgeBg: 'bg-red-500 text-white',
          glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.25)]'
        };
      case 'roast':
        return {
          border: 'border-amber-500/50',
          badgeBg: 'bg-amber-500 text-black',
          glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.25)]'
        };
      case 'topic':
        return {
          border: 'border-[#ffa31a]/50',
          badgeBg: 'bg-[#ffa31a] text-black',
          glow: 'shadow-[0_4px_20px_rgba(255,163,26,0.25)]'
        };
      case 'poll':
        return {
          border: 'border-cyan-500/50',
          badgeBg: 'bg-cyan-500 text-black',
          glow: 'shadow-[0_4px_20px_rgba(6,182,212,0.25)]'
        };
      default:
        return {
          border: 'border-zinc-700',
          badgeBg: 'bg-zinc-700 text-white',
          glow: 'shadow-lg'
        };
    }
  };

  return (
    <div className="fixed top-18 right-4 sm:right-6 z-40 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const style = getTypeStyle(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`relative overflow-hidden p-3.5 rounded-2xl bg-[#161616]/95 border ${style.border} ${style.glow} backdrop-blur-xl pointer-events-auto shadow-2xl`}
            >
              {/* Top Row: Badge, Title & Close */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base shrink-0">{toast.senderAvatar}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${style.badgeBg}`}>
                    {toast.badge}
                  </span>
                  <h5 className="text-xs font-bold text-white truncate">{toast.title}</h5>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description Body */}
              <p className="text-xs text-zinc-300 font-medium leading-relaxed pl-6 line-clamp-2">
                {toast.description}
              </p>

              {/* Footer Meta */}
              <div className="flex items-center justify-between mt-2 pl-6 text-[10px] text-zinc-500">
                <span className="truncate">{toast.senderName}</span>
                <span className="text-[#ffa31a] hover:underline cursor-pointer" onClick={openPanel}>
                  View in Center 🔔
                </span>
              </div>

              {/* 15-second visual progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 15, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-[2px] bg-[#ffa31a]/60"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
