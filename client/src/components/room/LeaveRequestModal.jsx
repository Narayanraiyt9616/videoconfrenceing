import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, X, LogOut } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export function LeaveRequestModal({ isOpen, onClose, onApprovedLeave }) {
  const { requestLeavePermission } = useSocket();

  const [reason, setReason] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');

  if (!isOpen) return null;

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsWaiting(true);
    setDeniedMessage('');

    try {
      await requestLeavePermission(reason.trim() || 'Call completed');
      toast.success('Host approved your exit! 👋');
      onApprovedLeave();
      onClose();
    } catch (err) {
      setDeniedMessage(err.message || 'Host ne mana kar diya! Abhi room me hi rehna padega! 😂🔥');
      setIsWaiting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#2e2e2e] shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">ROOM IS LOCKED 🔒</h3>
            <p className="text-xs text-zinc-400">Host approval required to leave</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] text-xs text-zinc-300 mb-5 leading-relaxed">
          <p>
            <strong className="text-[#ffa31a]">Rule:</strong> Bina Room Creator (Host) ki permission ke room chhodna mana hai! 😂🔥
          </p>
        </div>

        {deniedMessage ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-sm font-bold text-red-300">
              {deniedMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                setDeniedMessage('');
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              STAY IN ROOM 😂
            </button>
          </div>
        ) : isWaiting ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 border-3 border-[#ffa31a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h4 className="text-base font-extrabold text-white mb-1">WAITING FOR HOST APPROVAL...</h4>
            <p className="text-xs text-zinc-400">
              Your leave request has been sent to the room creator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Reason to Leave (Optional)
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. Mummy bula rahi hai / Dinner time 😂"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-sm focus:outline-none focus:border-[#ffa31a]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#222] hover:bg-[#282828] text-zinc-300 border border-[#333] transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl font-extrabold text-xs bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>REQUEST LEAVE</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
