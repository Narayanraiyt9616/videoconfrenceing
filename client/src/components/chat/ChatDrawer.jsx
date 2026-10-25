import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Trash2,
  Smile,
  Shield,
  MessageSquare,
  Sparkles,
  Zap,
  Image as ImageIcon,
  GraduationCap,
  User,
  Hand,
  Clock
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { GifPickerModal } from './GifPickerModal.jsx';

const QUICK_REACTIONS = ['👍', '💡', '❓', '👏', '🎯'];

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
    isHost,
    roomSettings
  } = useSocket();

  const [input, setInput] = useState('');
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

    sendMessage(input.trim());

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
      className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50 flex flex-col bg-white border-l border-[#CBD5E1] shadow-2xl font-sans"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-[#0F172A]">Classroom Discussion</h3>
            </div>
            <p className="text-[11px] text-[#64748B]">Ask questions & collaborate with peers</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-2 text-[#2563EB]">
              💬
            </div>
            <p className="text-sm font-bold text-[#0F172A]">No classroom messages yet</p>
            <p className="text-xs text-[#64748B] max-w-xs mt-1 leading-relaxed">
              Post a question to the faculty, ask for clarification, or discuss lecture topics.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === participant?.id;
            const isFacultySender = msg.senderRole === 'faculty' || msg.isHost;

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Info with Faculty / Student Badge */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                  <span>{msg.senderAvatar || '🎓'}</span>
                  <span className={`font-bold ${isMe ? 'text-[#1E3A8A]' : 'text-[#0F172A]'}`}>
                    {msg.senderName}
                  </span>

                  {/* Role Badge */}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isFacultySender
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                    }`}
                  >
                    {isFacultySender ? 'Faculty' : 'Student'}
                  </span>

                  <span className="text-[10px] text-[#94A3B8]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl relative transition-all shadow-2xs ${
                    isMe
                      ? 'bg-[#1E3A8A] text-white rounded-tr-xs'
                      : isFacultySender
                      ? 'bg-amber-50/80 border border-amber-200 text-[#0F172A] rounded-tl-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-xs'
                  }`}
                >
                  {/* Inline Media (Slides, Diagram, Reference Image) */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-[#CBD5E1] bg-black cursor-pointer">
                      {msg.mediaType === 'video' ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          playsInline
                          className="w-full max-h-52 object-contain bg-black"
                        />
                      ) : (
                        <img
                          src={msg.mediaUrl}
                          alt="Lecture Media"
                          onClick={() => setZoomedMedia(msg.mediaUrl)}
                          className="w-full max-h-52 object-contain hover:scale-102 transition-transform"
                        />
                      )}
                    </div>
                  )}

                  {msg.text && (
                    <p className={`text-xs leading-relaxed break-words font-medium ${isMe ? 'text-white' : 'text-[#0F172A]'}`}>
                      {msg.text}
                    </p>
                  )}

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, uids]) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg.id, emoji)}
                          className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                            uids.includes(participant?.id)
                              ? 'bg-blue-100 text-[#1E3A8A] border border-[#2563EB]'
                              : 'bg-slate-100 text-[#64748B] border border-[#CBD5E1]'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-bold">{uids.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Reaction Hover Bar */}
                {hoveredMessageId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute -top-3 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center gap-1 p-1 rounded-xl bg-white border border-[#CBD5E1] shadow-lg`}
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
                        className="text-red-500 hover:text-red-700 p-0.5 ml-1"
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
        <div className="px-4 py-1.5 text-[11px] text-[#2563EB] italic flex items-center gap-2 bg-[#F1F5F9] border-t border-[#E2E8F0]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
          <span>
            {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is typing a question...' : 'are typing...'}
          </span>
        </div>
      )}

      {/* Input Section */}
      {!roomSettings?.allowJoinerChat && !isHost ? (
        <div className="p-4 border-t border-[#CBD5E1] bg-slate-50 text-center">
          <p className="text-xs font-bold text-amber-700">Faculty has paused classroom discussion 🔒</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">You will be able to post questions when discussion resumes.</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3.5 border-t border-[#CBD5E1] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#1E3A8A]" />
              Academic Discussion
            </span>

            {/* Media Attachment */}
            <button
              type="button"
              onClick={() => setIsGifPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F1F5F9] hover:bg-slate-200 text-[#1E3A8A] transition-all cursor-pointer border border-[#CBD5E1]"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Attach Image / Diagram</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your question or thought..."
              maxLength={300}
              className="w-full pl-3.5 pr-11 py-2.5 rounded-xl text-xs bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-1.5 p-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Media Zoom Modal */}
      {zoomedMedia && (
        <div
          onClick={() => setZoomedMedia(null)}
          className="fixed inset-0 z-80 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl p-2"
          >
            <img
              src={zoomedMedia}
              alt="Zoomed Reference"
              className="w-full h-auto object-contain max-h-[80vh] rounded-xl"
            />
            <button
              onClick={() => setZoomedMedia(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      <GifPickerModal
        isOpen={isGifPickerOpen}
        onClose={() => setIsGifPickerOpen(false)}
        localStream={localStream}
        onSendMedia={({ mediaUrl, mediaType, text }) => {
          sendMediaMessage({
            mediaUrl,
            mediaType,
            text,
            isSecret: false
          });
        }}
      />
    </motion.div>
  );
}
