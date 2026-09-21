import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Smile,
  Gamepad2,
  Vote,
  MessageSquare,
  LogOut,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { ReactionPicker } from '../common/ReactionPicker.jsx';

export function RoomControls({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  isChatOpen,
  unreadCount = 0,
  onOpenGames,
  onOpenPolls,
  onOpenGifs,
  onLeaveRoom,
  onRequestLeave,
  onEndRoom,
  isHost
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center max-w-[98vw]">
      {/* Floating Reaction Picker Popover */}
      <AnimatePresence>
        {showReactionPicker && (
          <div className="mb-3">
            <ReactionPicker onClose={() => setShowReactionPicker(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Main Control Dock */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-[#141414]/95 border border-[#2e2e2e] shadow-2xl backdrop-blur-md max-w-full overflow-x-auto"
      >
        {/* 1. Mic Button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isAudioMuted
              ? 'bg-red-500/20 border border-red-500/40 text-red-400'
              : 'bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-[#ffa31a]'
          }`}
          title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* 2. Video Camera Button */}
        <button
          type="button"
          onClick={onToggleVideo}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isVideoOff
              ? 'bg-red-500/20 border border-red-500/40 text-red-400'
              : 'bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-white'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* 3. Screen Share Button */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isScreenSharing
              ? 'bg-[#ffa31a] text-black shadow-md shadow-[#ffa31a]/30'
              : 'bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-white'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-6 bg-[#2f2f2f] mx-0.5" />

        {/* 4. Reaction Picker Trigger */}
        <button
          type="button"
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showReactionPicker
              ? 'bg-[#ffa31a] text-black'
              : 'bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-[#ffa31a]'
          }`}
          title="Send Reaction Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* 5. Games Hub Trigger */}
        <button
          type="button"
          onClick={onOpenGames}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-white flex items-center justify-center transition-all cursor-pointer"
          title="Play Kalesh Games"
        >
          <Gamepad2 className="w-5 h-5" />
        </button>

        {/* 6. Anonymous Polls Trigger */}
        <button
          type="button"
          onClick={onOpenPolls}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-white flex items-center justify-center transition-all cursor-pointer"
          title="Anonymous Polls"
        >
          <Vote className="w-5 h-5" />
        </button>

        {/* 7. GIF & Image Hub Trigger */}
        <button
          type="button"
          onClick={onOpenGifs}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-[#ffa31a] flex items-center justify-center transition-all cursor-pointer"
          title="GIFs, Memes & Image Sharing"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* 8. Chat Toggle Trigger */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isChatOpen
              ? 'bg-[#ffa31a] text-black shadow-md shadow-[#ffa31a]/30 font-bold'
              : 'bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-white'
          }`}
          title="Open Kalesh Live Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffa31a] text-[10px] font-black text-black flex items-center justify-center border-2 border-[#141414]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="w-[1px] h-6 bg-[#2f2f2f] mx-0.5" />

        {/* 9. Leave Room */}
        <button
          type="button"
          onClick={isHost ? onLeaveRoom : (onRequestLeave || onLeaveRoom)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#222222] hover:bg-red-500/20 border border-[#383838] hover:border-red-500/40 text-[#888888] hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
          title={isHost ? 'Leave Room' : 'Request Permission to Leave 🔒'}
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* 10. Host End Room Button */}
        {isHost && (
          <button
            type="button"
            onClick={onEndRoom}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 flex items-center justify-center transition-all cursor-pointer"
            title="End Kalesh for Everyone (Destroy Room Memory)"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
