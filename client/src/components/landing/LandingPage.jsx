import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatedBackground } from './AnimatedBackground.jsx';
import { HeroSection } from './HeroSection.jsx';
import { CreateRoomModal } from './CreateRoomModal.jsx';
import { JoinRoomModal } from './JoinRoomModal.jsx';
import { normalizeRoomCode } from '../../utils/roomUtils.js';

export function LandingPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [initialJoinCode, setInitialJoinCode] = useState('');

  // Auto-open Join modal if user arrived via invite link (/join/:roomCode, ?join=..., #join=...)
  useEffect(() => {
    const queryCode = searchParams.get('join') || searchParams.get('room') || searchParams.get('code');
    const hashMatch = location.hash ? location.hash.replace(/^#/, '').match(/(?:join=|room=)?([A-Z0-9-]+)/i) : null;
    const rawCandidate = roomCode || queryCode || (hashMatch ? hashMatch[1] : null);

    if (rawCandidate) {
      const normalized = normalizeRoomCode(rawCandidate);
      if (normalized) {
        setInitialJoinCode(normalized);
        setIsJoinOpen(true);
      }
    }
  }, [roomCode, searchParams, location.hash]);

  const handleRoomReady = (code) => {
    navigate(`/room/${code}`);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Animated Ambient Blobs & Floating Emojis */}
      <AnimatedBackground />

      {/* Main Hero Banner */}
      <main className="flex-1 flex items-center justify-center">
        <HeroSection
          onCreateClick={() => setIsCreateOpen(true)}
          onJoinClick={() => {
            setInitialJoinCode('');
            setIsJoinOpen(true);
          }}
        />
      </main>

      {/* Kalesh Hub Footer */}
      <footer className="w-full py-6 text-center text-xs text-[#888888] border-t border-[#222222] relative z-10 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">KALESH</span>
            <span className="bg-[#ffa31a] text-black text-[10px] px-1.5 py-0.5 rounded font-black">
              hub
            </span>
            <span className="text-[#444444]">•</span>
            <span>Ephemeral Hangout Platform</span>
          </div>
          <div className="text-[#666666] text-xs">
            100% RAM Memory • Instant Destruction on Exit • Zero Database
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRoomReady={handleRoomReady}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        initialCode={initialJoinCode}
        onClose={() => setIsJoinOpen(false)}
        onJoinSuccess={handleRoomReady}
      />
    </div>
  );
}
