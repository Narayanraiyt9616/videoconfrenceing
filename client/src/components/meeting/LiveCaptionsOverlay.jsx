import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subtitles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export function LiveCaptionsOverlay({ isLocalAudioMuted }) {
  const { isCaptionsEnabled, liveCaptions, broadcastCaption, participant } = useSocket();
  const [localTranscript, setLocalTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Initialize Web Speech API for local speech recognition
  useEffect(() => {
    if (!isCaptionsEnabled || isLocalAudioMuted) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setLocalTranscript('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const textToDisplay = final || interim;
        if (textToDisplay.trim()) {
          setLocalTranscript(textToDisplay);
          broadcastCaption(textToDisplay, Boolean(final));
        }
      };

      recognition.onerror = (err) => {
        if (err.error !== 'no-speech') {
          console.warn('[SpeechRecognition] error:', err.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart if captions are still enabled
        if (isCaptionsEnabled && !isLocalAudioMuted) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[SpeechRecognition] could not start:', err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isCaptionsEnabled, isLocalAudioMuted, broadcastCaption]);

  if (!isCaptionsEnabled) return null;

  // Combine local transcript and remote transcripts
  const activeCards = [];

  if (localTranscript) {
    activeCards.push({
      senderId: 'local',
      senderName: participant?.name || 'You',
      senderAvatar: participant?.avatar || '👤',
      text: localTranscript,
      isLocal: true
    });
  }

  // Include last 2 remote captions
  const recentRemote = (liveCaptions || []).slice(-2);
  recentRemote.forEach((c) => {
    if (c.senderId !== participant?.id) {
      activeCards.push({
        senderId: c.senderId,
        senderName: c.senderName,
        senderAvatar: c.senderAvatar || '👤',
        text: c.text,
        isLocal: false
      });
    }
  });

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2 max-w-2xl w-full px-4">
      <AnimatePresence>
        {activeCards.map((card, idx) => (
          <motion.div
            key={card.senderId + idx}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/85 border border-[#3c4043] backdrop-blur-md shadow-2xl text-white text-xs sm:text-sm font-medium max-w-full truncate"
          >
            <span className="w-2 h-2 rounded-full bg-[#1a73e8] shrink-0 animate-pulse" />
            <span className="font-bold text-[#8ab4f8] shrink-0">
              {card.senderAvatar} {card.senderName}:
            </span>
            <span className="text-zinc-100 truncate">{card.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
