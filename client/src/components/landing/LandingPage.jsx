import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../navbar/Navbar.jsx';
import { MeetHero } from './MeetHero.jsx';
import { CreateRoomModal } from './CreateRoomModal.jsx';
import { JoinRoomModal } from './JoinRoomModal.jsx';
import { ScheduleMeetingModal } from '../meeting/ScheduleMeetingModal.jsx';
import { normalizeRoomCode } from '../../utils/roomUtils.js';
import { GraduationCap, ShieldCheck, Heart, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [initialJoinCode, setInitialJoinCode] = useState('');

  // Auto-open Join or navigate if user arrived via invite link
  useEffect(() => {
    const queryCode = searchParams.get('join') || searchParams.get('room') || searchParams.get('code');
    const hashMatch = location.hash ? location.hash.replace(/^#/, '').match(/(?:join=|room=)?([A-Z0-9-]+)/i) : null;
    const rawCandidate = roomCode || queryCode || (hashMatch ? hashMatch[1] : null);

    if (rawCandidate) {
      const normalized = normalizeRoomCode(rawCandidate);
      if (normalized) {
        navigate(`/room/${normalized}`);
      }
    }
  }, [roomCode, searchParams, location.hash, navigate]);

  const handleRoomReady = (code) => {
    navigate(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col justify-between overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
      {/* Top CampusVerse Live Navbar */}
      <Navbar onInstantMeetingStart={() => setIsCreateOpen(true)} />

      {/* Main Educational Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <MeetHero
          onScheduleClick={() => setIsScheduleOpen(true)}
          onInstantMeetingStart={() => setIsCreateOpen(true)}
        />
      </main>

      {/* Professional Educational Footer */}
      <footer className="w-full py-8 text-xs text-[#64748B] border-t border-[#E2E8F0] bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-[#0F172A] text-sm font-['Outfit']">CampusVerse Live</span>
            </div>
            <span className="hidden sm:inline text-[#CBD5E1]">•</span>
            <span className="text-[#64748B] font-medium">Connecting Education Through Technology.</span>
          </div>

          {/* Educational Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[#0F172A] font-medium">
            <Link to="/dashboard" className="hover:text-[#2563EB] transition-colors">
              Classroom Dashboard
            </Link>
            <span className="text-[#CBD5E1]">•</span>
            <Link to="/dashboard?tab=classroom" className="hover:text-[#2563EB] transition-colors">
              Live Lectures
            </Link>
            <span className="text-[#CBD5E1]">•</span>
            <Link to="/dashboard?tab=recordings" className="hover:text-[#2563EB] transition-colors">
              Lecture Archive
            </Link>
            <span className="text-[#CBD5E1]">•</span>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              Schedule Class
            </button>
          </div>

          {/* Copyright */}
          <div className="text-[#64748B] text-xs">
            © 2026 CampusVerse. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Shared Classroom Modals */}
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

      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onMeetingScheduled={(newMtg) => {
          navigate(`/dashboard?tab=upcoming`);
        }}
      />
    </div>
  );
}
