import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export function EndRoomDialog({ isOpen, onClose }) {
  const { endRoom } = useSocket();

  if (!isOpen) return null;

  const handleConfirm = () => {
    endRoom();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-md p-6 rounded-2xl bg-[#141414] border border-red-500/40 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">END ROOM FOR ALL?</h3>
              <p className="text-xs text-red-400 font-semibold">Immediate & Irreversible Deletion</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-zinc-300 mb-6 leading-relaxed">
            <p>
              All participants will be disconnected immediately. All in-memory chat messages, shared GIFs/images, and poll votes will be <strong className="text-white">permanently wiped from RAM</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#222] hover:bg-[#282828] text-zinc-300 border border-[#333] transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-extrabold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>END ROOM</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
