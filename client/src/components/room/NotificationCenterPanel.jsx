import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, Filter, Sparkles, Check, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';

export function NotificationCenterPanel() {
  const { isPanelOpen, closePanel, history, clearHistory } = useNotifications();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'dare' | 'roast' | 'poll' | 'meeting'
  const panelRef = useRef(null);

  // Close panel on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPanelOpen) closePanel();
    };

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && isPanelOpen) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end font-sans">
      <motion.div
        ref={panelRef}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-sm sm:max-w-md h-full bg-[#141414] border-l border-[#282828] shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626] bg-[#181818] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">ACTIVITY CENTER</h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#ffa31a] text-black">
                  {history.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Recent Dares, Roasts & Notifications</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                title="Clear all activity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={closePanel}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-2.5 bg-[#181818] border-b border-[#262626] overflow-x-auto text-[11px] font-bold">
          {['all', 'dare', 'roast', 'poll', 'meeting'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer capitalize ${
                filterType === cat
                  ? 'bg-[#ffa31a] text-black font-extrabold shadow-sm'
                  : 'bg-[#202020] text-zinc-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Activity' : cat}
            </button>
          ))}
        </div>

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-2xl mb-3 text-[#ffa31a]">
                🔔
              </div>
              <p className="text-sm font-bold text-zinc-300 mb-1">No activity recorded</p>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                When Dares, Roasts, Polls, or Reactions happen, they will be archived here.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#2c2c2c] hover:border-[#3d3d3d] transition-colors flex flex-col gap-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span>{item.senderAvatar}</span>
                    <span className="font-extrabold text-white truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 font-medium leading-relaxed pl-6">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-1 pl-6 text-[10px] text-zinc-500 border-t border-[#252525]">
                  <span>{item.senderName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/60 border border-[#333] text-[#ffa31a]">
                    {item.badge}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
