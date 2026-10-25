import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Plus,
  Keyboard,
  Calendar,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  Presentation,
  CheckCircle2,
  Clock,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function MeetHero({ onScheduleClick, onInstantMeetingStart }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [isInstantLoading, setIsInstantLoading] = useState(false);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    const clean = meetingCodeInput
      .trim()
      .replace(/https?:\/\/[^/]+\/room\//i, '')
      .replace(/https?:\/\/[^/]+\/join\//i, '');

    if (!clean) {
      toast.error('Please enter a valid class code or meeting link');
      return;
    }

    navigate(`/room/${clean}`);
  };

  const handleStartInstantClass = async () => {
    setIsInstantLoading(true);
    try {
      const res = await api.post('/api/meetings/instant', {
        title: user ? `${user.name}'s Live Lecture` : 'CampusVerse Live Lecture',
        isClassroom: true,
        courseCode: 'ACAD-LIVE'
      });
      const code = res.meeting?.code || res.meeting?.meetingCode;
      if (res.success && code) {
        toast.success('Virtual classroom initialized!');
        navigate(`/room/${code}`);
      }
    } catch (err) {
      toast.error('Could not initialize classroom: ' + err.message);
    } finally {
      setIsInstantLoading(false);
    }
  };

  const canSchedule = user && ['faculty', 'admin'].includes(user.role);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 select-none">
      {/* Two-Column Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Academic Headings and Action Row */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-bold text-[#1E3A8A]">
            <GraduationCap className="w-4 h-4 text-[#2563EB]" />
            <span>CAMPUSVERSE LIVE • VIRTUAL CLASSROOM PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.15] font-['Outfit']">
            Welcome to <br />
            <span className="text-[#1E3A8A]">CampusVerse Live</span>
          </h1>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2563EB]">
              Learn Together. Connect Everywhere.
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Connect with faculty, attend live lectures, collaborate with classmates, and experience interactive digital learning.
            </p>
          </div>

          {/* Action Box: Join & Create */}
          <div className="pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              {/* Primary Action Button */}
              {canSchedule ? (
                <button
                  type="button"
                  onClick={handleStartInstantClass}
                  disabled={isInstantLoading}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-70"
                >
                  <Video className="w-4 h-4 fill-white" />
                  <span>{isInstantLoading ? 'Starting Lecture...' : 'Start Live Lecture'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Presentation className="w-4 h-4" />
                  <span>Enter Digital Classroom</span>
                </button>
              )}

              {/* Schedule Lecture Action (Faculty/Admin) */}
              {canSchedule && (
                <button
                  type="button"
                  onClick={onScheduleClick}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#1E3A8A] font-bold text-sm border border-[#E2E8F0] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  <span>Schedule Class</span>
                </button>
              )}
            </div>

            {/* Quick Join Input Box */}
            <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto lg:mx-0">
              <div className="relative w-full">
                <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={meetingCodeInput}
                  onChange={(e) => setMeetingCodeInput(e.target.value)}
                  placeholder="Enter classroom code (e.g. CS4-0210-LEC)"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm transition-all cursor-pointer"
              >
                Join Class
              </button>
            </form>
          </div>

          {/* Educational Trust Indicators */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              Automated Attendance Logs
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              Collaborative Whiteboard
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              Secure Role-Based Access
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Virtual Classroom Preview Card */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto max-w-md w-full">
            {/* Ambient Background Aura */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#0D9488] opacity-20 blur-xl" />

            <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden">
              {/* Classroom Preview Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Lecture in Progress</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-medium">
                  CS402 • Room 3A
                </span>
              </div>

              {/* Classroom Visual Demo Stage */}
              <div className="p-5 space-y-4">
                {/* Simulated Lecturer Screen Tile */}
                <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden flex flex-col justify-between p-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-white/90">
                    <span className="px-2 py-0.5 rounded bg-black/60 font-semibold backdrop-blur-sm">
                      Dr. Rajiv Sen • Distributed Systems
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0D9488] font-bold text-[10px]">
                      Screen Sharing Active
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center my-auto space-y-1">
                    <Presentation className="w-10 h-10 text-blue-400" />
                    <p className="text-xs font-bold text-white">Consensus Algorithms: Raft vs Paxos</p>
                    <p className="text-[10px] text-blue-200">Interactive Whiteboard & Slide deck active</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/80">
                    <span className="px-1.5 py-0.5 rounded bg-black/50">48 Students Connected</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/50 text-[#16A34A] font-bold">1080p HD</span>
                  </div>
                </div>

                {/* Live Classroom Mini Feature Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-[#1E3A8A] mb-1">
                      <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="text-xs font-bold">Attendance</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Real-time entry & departure logging with CSV export.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-[#0D9488] mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Study Notes</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Class materials and handouts shared live.</p>
                  </div>
                </div>

                {/* Dashboard Link Callout */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] text-xs font-bold flex items-center justify-center gap-2 border border-blue-200 transition-colors cursor-pointer"
                >
                  <span>Explore Class Schedule & Past Lectures</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
