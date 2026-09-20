import React from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext.jsx';

const EMOJIS = ['🔥', '😂', '💀', '👀', '👏', '😮', '🤡', '⚡'];

export function ReactionPicker({ onClose }) {
  const { sendReaction } = useSocket();

  const handleSelect = (emoji) => {
    sendReaction(emoji);
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="flex items-center gap-1.5 p-2 rounded-2xl bg-[#181818] border border-[#2e2e2e] shadow-2xl backdrop-blur-xl"
    >
      {EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.35, y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSelect(emoji)}
          className="w-10 h-10 flex items-center justify-center text-2xl rounded-xl hover:bg-[#282828] transition-colors cursor-pointer"
          title={`Send ${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}
