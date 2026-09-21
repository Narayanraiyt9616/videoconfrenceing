import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Trash2,
  Smile,
  Shield,
  Ghost,
  MessageSquare,
  Sparkles,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { GifPickerModal } from './GifPickerModal.jsx';

const QUICK_REACTIONS = ['😂', '🔥', '💀', '👀', '👍'];

export function ChatDrawer({ isOpen, onClose, localStream }) {
  const {
    messages,
    sendMessage,
    sendSecretMessage,
    sendMediaMessage,
    deleteMessage,
    reactToMessage,
    typingUsers,
    setTyping,
    participant,
    isHost
  } = useSocket();

  const [input, setInput] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [zoomedMedia, setZoomedMedia] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isSecretMode) {
      sendSecretMessage(input.trim());
    } else {
      sendMessage(input.trim());
    }

    setInput('');
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50 flex flex-col bg-[#141414]/98 backdrop-blur-2xl border-l border-[#262626] shadow-2xl font-sans"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#181818]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a] shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-wide">LIVE CHAT</h3>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#ffa31a] text-black uppercase tracking-wider">
                RAM ONLY
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Ephemeral Stream • Zero Logs</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Secret / Incognito Mode Banner */}
      {isSecretMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#221808] border-b border-[#ffa31a]/30 flex items-center justify-between text-xs text-[#ffa31a]"
        >
          <div className="flex items-center gap-2">
            <Ghost className="w-4 h-4 text-[#ffa31a] animate-pulse" />
            <span className="font-bold">INCOGNITO MODE:</span>
            <span className="text-zinc-300">Identity hidden 🤫</span>
          </div>
        </motion.div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-2xl mb-3 text-[#ffa31a]">
              💬
            </div>
            <p className="text-sm font-bold text-zinc-300 mb-1">No messages yet</p>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              Start the conversation or drop a GIF reaction below!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === participant?.id;
            const isSecret = msg.isSecret;

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Info */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                  <span>{msg.senderAvatar || '💬'}</span>
                  <span
                    className={`font-bold ${
                      isSecret
                        ? 'text-[#ffa31a] italic'
                        : isMe
                        ? 'text-[#ffa31a]'
                        : 'text-zinc-300'
                    }`}
                  >
                    {isSecret ? 'Anonymous User 🤫' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl relative transition-all ${
                    isSecret
                      ? 'bg-[#251b0a] border border-[#ffa31a]/40 text-[#ffa31a]'
                      : isMe
                      ? 'bg-[#ffa31a]/15 border border-[#ffa31a]/30 text-white'
                      : 'bg-[#1e1e1e] border border-[#2c2c2c] text-zinc-200'
                  }`}
                >
                  {/* Inline Media (Image / GIF / Video) Payload */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-[#333] bg-black cursor-pointer group/media">
                      {msg.mediaType === 'video' ? (
                        <div className="relative">
                          <video
                            src={msg.mediaUrl}
                            controls
                            playsInline
                            className="w-full max-h-56 object-contain rounded-t-xl bg-black"
                          />
                          <div className="px-2 py-1 bg-[#141414] text-[10px] text-red-400 flex items-center justify-between border-t border-[#2a2a2a]">
                            <span className="font-extrabold uppercase">
                              [5s SHORT VIDEO]
                            </span>
                            <span
                              className="text-zinc-400 hover:text-white cursor-pointer"
                              onClick={() => setZoomedMedia({ url: msg.mediaUrl, type: 'video' })}
                            >
                              expand ↗
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <img
                            src={msg.mediaUrl}
                            alt="Media"
                            onClick={() => setZoomedMedia({ url: msg.mediaUrl, type: 'image' })}
                            className="w-full max-h-56 object-contain rounded-t-xl hover:scale-[1.02] transition-transform"
                          />
                          <div className="px-2 py-1 bg-[#141414] text-[10px] text-[#ffa31a] flex items-center justify-between border-t border-[#2a2a2a]">
                            <span className="font-extrabold uppercase">
                              [{msg.mediaType === 'gif' ? 'GIF' : 'IMAGE'}]
                            </span>
                            <span className="text-zinc-500">click to expand</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.text && <p className="text-xs leading-relaxed break-words">{msg.text}</p>}

                  {/* Reactions on Message */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, uids]) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg.id, emoji)}
                          className={`text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border flex items-center gap-1 transition-colors ${
                            uids.includes(participant?.id)
                              ? 'border-[#ffa31a] text-[#ffa31a]'
                              : 'border-[#333] text-zinc-400 hover:border-zinc-500'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-bold">{uids.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Quick Actions */}
                {hoveredMessageId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute -top-3 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center gap-1 p-1 rounded-xl bg-[#222] border border-[#3a3a3a] shadow-xl`}
                  >
                    {QUICK_REACTIONS.map((em) => (
                      <button
                        key={em}
                        onClick={() => reactToMessage(msg.id, em)}
                        className="hover:scale-125 transition-transform p-0.5 text-xs"
                      >
                        {em}
                      </button>
                    ))}
                    {(isMe || isHost) && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="text-red-400 hover:text-red-300 p-0.5 ml-1"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1.5 text-[11px] text-[#ffa31a] italic flex items-center gap-2 bg-[#181818]">
          <span className="w-2 h-2 rounded-full bg-[#ffa31a] animate-ping" />
          <span>
            {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
          </span>
        </div>
      )}

      {/* Input Section */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-[#262626] bg-[#181818] space-y-2.5">
        <div className="flex items-center justify-between">
          {/* Incognito Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              isSecretMode
                ? 'bg-[#ffa31a] text-black shadow-md'
                : 'bg-[#222] border border-[#333] text-zinc-400 hover:text-white'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>INCOGNITO {isSecretMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Visual Payload (GIF/Image) Trigger */}
          <button
            type="button"
            onClick={() => setIsGifPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-[#222] hover:bg-[#2a2a2a] border border-[#ffa31a]/40 text-[#ffa31a] transition-all cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>+ GIF / PHOTO</span>
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isSecretMode ? 'Type anonymous message...' : 'Type message here...'}
            maxLength={300}
            className={`w-full pl-4 pr-12 py-2.5 rounded-xl text-xs bg-[#121212] border border-[#2e2e2e] text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffa31a] transition-all ${
              isSecretMode ? 'border-[#ffa31a] ring-1 ring-[#ffa31a]/30' : ''
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1.5 p-2 rounded-lg bg-[#ffa31a] hover:bg-[#ff9000] text-black font-bold disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Fullscreen Media Zoom Modal */}
      {zoomedMedia && (
        <div
          onClick={() => setZoomedMedia(null)}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#ffa31a]/40 bg-[#121212] shadow-2xl flex items-center justify-center p-2"
          >
            {zoomedMedia.type === 'video' ? (
              <video
                src={zoomedMedia.url}
                controls
                autoPlay
                className="w-full h-auto object-contain max-h-[80vh] rounded-xl"
              />
            ) : (
              <img
                src={zoomedMedia.url || zoomedMedia}
                alt="Zoomed Media"
                className="w-full h-auto object-contain max-h-[80vh] rounded-xl"
              />
            )}
            <button
              onClick={() => setZoomedMedia(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-[#ffa31a] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* GIF & Image Picker Modal */}
      <GifPickerModal
        isOpen={isGifPickerOpen}
        onClose={() => setIsGifPickerOpen(false)}
        localStream={localStream}
        onSendMedia={({ mediaUrl, mediaType, text }) => {
          sendMediaMessage({
            mediaUrl,
            mediaType,
            text,
            isSecret: isSecretMode
          });
        }}
      />
    </motion.div>
  );
}
