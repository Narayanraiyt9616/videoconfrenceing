import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, UserPlus, LogOut } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export function HostApprovalModal() {
  const {
    isHost,
    pendingKnocks,
    leaveRequests,
    approveKnock,
    rejectKnock,
    approveLeave,
    rejectLeave
  } = useSocket();

  if (!isHost) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none font-sans">
      <AnimatePresence>
        {/* 1. Pending Knock Door Approvals */}
        {pendingKnocks.map((knock) => (
          <motion.div
            key={knock.socketId}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="p-4 rounded-2xl bg-[#181818] border border-[#333] shadow-2xl backdrop-blur-xl pointer-events-auto"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#252525] border border-[#3a3a3a] flex items-center justify-center text-2xl">
                {knock.avatar || '👤'}
              </div>
              <div className="truncate flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white truncate">{knock.name}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ffa31a] text-black uppercase tracking-wider">
                    KNOCKING
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Requesting approval to join</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => approveKnock(knock.socketId)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>ALLOW ENTRY</span>
              </button>

              <button
                type="button"
                onClick={() => rejectKnock(knock.socketId)}
                className="py-2 px-3 rounded-xl bg-[#221818] hover:bg-red-600/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Deny Connection"
              >
                <X className="w-3.5 h-3.5" />
                <span>DENY</span>
              </button>
            </div>
          </motion.div>
        ))}

        {/* 2. Pending Leave Requests */}
        {leaveRequests.map((req) => (
          <motion.div
            key={req.socketId}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="p-4 rounded-2xl bg-[#181818] border border-[#ffa31a]/40 shadow-2xl backdrop-blur-xl pointer-events-auto"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#252525] border border-[#ffa31a]/30 flex items-center justify-center text-2xl">
                {req.avatar || '🏃'}
              </div>
              <div className="truncate flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white truncate">{req.name}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-700 text-[#ffa31a] uppercase tracking-wider">
                    EXIT REQ
                  </span>
                </div>
                <p className="text-xs text-zinc-300 italic truncate">
                  "{req.reason || 'Wants to leave room'}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => approveLeave(req.socketId)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#282828] hover:bg-[#333] border border-[#3e3e3e] text-zinc-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span>ALLOW LEAVE</span>
              </button>

              <button
                type="button"
                onClick={() => rejectLeave(req.socketId)}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <X className="w-3.5 h-3.5" />
                <span>DENY / TRAP 😂</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
