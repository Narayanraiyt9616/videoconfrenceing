import React, { useState, useMemo } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Copy,
  Check,
  Users,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Radio,
  Globe,
  GraduationCap,
  CheckCircle2,
  CalendarDays,
  BookOpen,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';

/**
 * CampusVerseOnlineClassesSection
 * Professional, high-end Online Classes UI matching CampusVerse AI Design System
 * 
 * Theme Tokens:
 * - Primary Gold Gradients: from-[#F59E0B] to-[#D97706]
 * - Gold Borders & Highlights: #F1E7CF, #FDE68A, #D99A00
 * - Cream / Soft Yellow Cards: #FFFDF5, #FFF8E6, #FFFEFA
 * - Dark Slate Typography: #0F172A, #111827, #475569, #64748B
 */
export function CampusVerseOnlineClassesSection({
  meetings = [],
  loading = false,
  onRefresh,
  onScheduleOpen,
  onAttendanceSelect,
  onCopyLink,
  copiedCode,
  onDownloadIcs,
  onJoinMeeting,
  user
}) {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'live' | 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  // Filter only classroom / virtual class meetings
  const classroomMeetings = useMemo(() => {
    return meetings.filter((m) => m.isClassroom);
  }, [meetings]);

  // Extract unique course codes for filter dropdown
  const uniqueCourses = useMemo(() => {
    const set = new Set();
    classroomMeetings.forEach((m) => {
      if (m.courseCode && m.courseCode.trim()) {
        set.add(m.courseCode.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [classroomMeetings]);

  // Find currently live/ongoing class for top live alert banner
  const liveClass = useMemo(() => {
    return classroomMeetings.find((c) => c.status === 'ongoing');
  }, [classroomMeetings]);

  // Filtered classes according to sub-tab, search, and course code
  const filteredClasses = useMemo(() => {
    return classroomMeetings.filter((cls) => {
      const status = (cls.status || '').toLowerCase();

      // Sub-tab filter
      if (activeSubTab === 'live' && status !== 'ongoing') return false;
      if (activeSubTab === 'upcoming' && status !== 'scheduled') return false;
      if (activeSubTab === 'completed' && status !== 'ended') return false;

      // Course filter
      if (
        courseFilter !== 'all' &&
        (!cls.courseCode || cls.courseCode.trim().toUpperCase() !== courseFilter)
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (cls.title || '').toLowerCase().includes(q);
        const matchDesc = (cls.description || '').toLowerCase().includes(q);
        const matchCourse = (cls.courseCode || '').toLowerCase().includes(q);
        const matchCode = (cls.meetingCode || '').toLowerCase().includes(q);
        const matchHost = (cls.hostName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCourse && !matchCode && !matchHost) {
          return false;
        }
      }

      return true;
    });
  }, [classroomMeetings, activeSubTab, courseFilter, searchQuery]);

  // Dynamic counts for status tabs
  const tabCounts = useMemo(() => {
    const counts = { all: classroomMeetings.length, live: 0, upcoming: 0, completed: 0 };
    classroomMeetings.forEach((cls) => {
      const s = (cls.status || '').toLowerCase();
      if (s === 'ongoing') counts.live++;
      else if (s === 'scheduled') counts.upcoming++;
      else if (s === 'ended') counts.completed++;
    });
    return counts;
  }, [classroomMeetings]);

  return (
    <div className="space-y-6 animate-fade-in text-[#111827]">
      {/* 1. CAMPUSVERSE AI HERO BANNER */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-[#F1E7CF] p-6 sm:p-8 shadow-[0_4px_24px_rgba(217,119,6,0.05)]">
        {/* Subtle ambient golden glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FACC15]/10 via-[#F59E0B]/5 to-transparent rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#D97706]/5 rounded-full blur-2xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* CampusVerse Golden Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFF8E6] text-[#B45309] border border-[#FDE68A] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>CampusVerse AI Online Classes</span>
              <span className="text-[#D97706]/40">|</span>
              <span className="text-[#D97706] font-semibold">Faculty & Student Virtual Lecture Platform</span>
            </div>

            {/* Main Heading with Golden Highlight */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
                CampusVerse AI Live Classes
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-2xl">
              Academic virtual lecture scheduling, WebRTC live audio/video streaming, participant telemetry, and live gradebook attendance.
            </p>

            {/* Golden divider dots */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2.5 h-1.5 rounded-full bg-[#D97706]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FDE68A]" />
            </div>
          </div>

          {/* Right side: User card capsule & Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
            {user && (
              <div className="p-3.5 rounded-2xl bg-[#FFFDF5] border border-[#F1E7CF] flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white font-black text-sm flex items-center justify-center shadow-xs ring-1 ring-[#FDE68A]">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-[#0F172A] leading-tight truncate max-w-[170px]">
                    {user.name || 'Campus Member'}
                  </p>
                  <p className="text-[11px] font-semibold text-[#B45309] font-mono mt-0.5 truncate max-w-[170px]">
                    {user.role ? `Role: ${user.role.toUpperCase()}` : user.email || 'Online Classroom'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center font-bold text-xs px-3 py-2.5 rounded-xl border border-[#F1E7CF] bg-white text-[#0F172A] hover:bg-[#FFF8E6] hover:border-[#FDE68A] shadow-xs transition-all cursor-pointer"
                title="Refresh classes"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#D97706] ${loading ? 'animate-spin' : ''}`} />
                <span className="ml-1.5">Refresh</span>
              </button>

              <button
                type="button"
                onClick={onScheduleOpen}
                className="inline-flex items-center justify-center font-bold text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:from-[#FBBF24] hover:to-[#E5A900] shadow-xs border border-[#F59E0B] transition-all cursor-pointer gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Online Class</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE NOW BANNER (if any class is currently live) */}
      {liveClass && (
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-[#FFF8E6] border-2 border-rose-400 shadow-md animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  CLASS IN PROGRESS RIGHT NOW
                </span>
                {liveClass.courseCode && (
                  <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider font-mono">
                    {liveClass.courseCode}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                {liveClass.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569] font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Started {new Date(liveClass.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span>•</span>
                <span>Instructor: <strong className="text-[#111827]">{liveClass.hostName}</strong></span>
                <span>•</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#F1E7CF] text-[#B45309] font-bold">
                  Code: {liveClass.meetingCode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onJoinMeeting(liveClass.meetingCode)}
              className="inline-flex items-center justify-center font-black text-xs px-5 py-3 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white hover:from-[#B45309] hover:to-[#D97706] shadow-md shadow-[#D97706]/20 border border-[#F59E0B] transition-all cursor-pointer gap-2 shrink-0"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Class Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CAMPUSVERSE AI ACADEMIC METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#F1E7CF] shadow-xs hover:border-[#D99A00] transition-all flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#FFF8E6] text-[#D97706] border border-[#FDE68A] shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Total Classes</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] mt-0.5 block leading-tight">
              {classroomMeetings.length}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#F1E7CF] shadow-xs hover:border-[#D99A00] transition-all flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Live Now</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 block leading-tight">
              {tabCounts.live}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#F1E7CF] shadow-xs hover:border-[#D99A00] transition-all flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#FFF8E6] text-[#B45309] border border-[#FDE68A] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Upcoming</span>
            <span className="text-xl sm:text-2xl font-black text-[#B45309] mt-0.5 block leading-tight">
              {tabCounts.upcoming}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#F1E7CF] shadow-xs hover:border-[#D99A00] transition-all flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B] block">Telemetry Active</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block leading-tight">
              {classroomMeetings.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. TABS AND SEARCH FILTERS BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#F1E7CF] shadow-xs">
          {[
            { id: 'all', label: 'All Classes', count: tabCounts.all },
            { id: 'live', label: 'Live Now', count: tabCounts.live, isLive: true },
            { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
            { id: 'completed', label: 'Completed', count: tabCounts.completed },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#FFF8E6]/70'
                }`}
              >
                {tab.isLive && tab.count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#475569]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Course filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course or title..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#F1E7CF] bg-white text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#D99A00] focus:ring-1 focus:ring-[#D99A00]/20 shadow-xs"
            />
          </div>

          {uniqueCourses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#F1E7CF] bg-white text-xs font-bold text-[#111827] focus:outline-none focus:border-[#D99A00] shadow-xs cursor-pointer"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 5. CLASS CARDS GRID */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-[#F1E7CF] shadow-xs space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-[#FFF8E6] text-[#D97706] border border-[#FDE68A]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#111827]">No online classes found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto font-medium leading-relaxed">
            {searchQuery || courseFilter !== 'all' || activeSubTab !== 'all'
              ? 'No classes match the chosen filters. Try clearing your search or switching tabs.'
              : 'You have not scheduled any online classes yet. Click "Schedule Online Class" above to set up your virtual lecture with attendance.'}
          </p>
          {searchQuery || courseFilter !== 'all' || activeSubTab !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCourseFilter('all');
                setActiveSubTab('all');
              }}
              className="text-xs font-bold text-[#D97706] hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onScheduleOpen}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold text-xs hover:from-[#FBBF24] hover:to-[#E5A900] shadow-xs border border-[#F59E0B] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Your First Class</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredClasses.map((cls) => {
            const isLive = cls.status === 'ongoing';
            const isCompleted = cls.status === 'ended';
            const isScheduled = cls.status === 'scheduled';

            return (
              <div
                key={cls._id || cls.meetingCode}
                className={`relative rounded-3xl border bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between hover:shadow-md ${
                  isLive
                    ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/15'
                    : 'border-[#F1E7CF] hover:border-[#D99A00]'
                }`}
              >
                {/* Header row: Platform badge + Status badge + Course pill */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Platform pill */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-900 border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <Globe className="w-3 h-3 text-[#D97706]" />
                        <span>CampusVerse Live</span>
                      </span>

                      {/* Status badge */}
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-300 shadow-xs animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                          Live Now
                        </span>
                      ) : isScheduled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Upcoming
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Course Code / Cohort badge */}
                    <span className="text-[11px] font-bold text-[#B45309] bg-[#FFF8E6] border border-[#FDE68A] px-2.5 py-0.5 rounded-lg font-mono">
                      {cls.courseCode ? cls.courseCode.toUpperCase() : 'VIRTUAL LECTURE'}
                    </span>
                  </div>

                  {/* Subject and Title */}
                  <div className="mt-3.5">
                    <p className="text-xs font-bold text-[#D97706] uppercase tracking-wider font-mono">
                      {cls.courseCode ? `Course: ${cls.courseCode}` : 'Online Class'}
                    </p>
                    <h3 className="text-base font-black text-[#111827] mt-0.5 line-clamp-1">
                      {cls.title}
                    </h3>
                    {cls.description && (
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2 font-medium leading-relaxed">
                        {cls.description}
                      </p>
                    )}
                  </div>

                  {/* Date, Time & Meeting Code Information Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#FFFDF5] border border-[#F1E7CF] text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#111827] flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                        {new Date(cls.scheduledStartTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#D97706]">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(cls.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {cls.durationMinutes || 60} mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] font-medium pt-1 border-t border-[#F1E7CF]/60 flex-wrap gap-2">
                      <div>
                        Instructor: <strong className="text-[#111827] font-semibold">{cls.hostName}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Room Code:</span>
                        <code className="px-1.5 py-0.5 rounded bg-white border border-[#F1E7CF] font-mono font-bold text-[#B45309]">
                          {cls.meetingCode}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Bottom Bar */}
                <div className="mt-4 pt-4 border-t border-[#F1E7CF] space-y-2.5">
                  <div className="flex items-center gap-2">
                    {/* Primary Join / Enter Button */}
                    <button
                      type="button"
                      onClick={() => onJoinMeeting(cls.meetingCode)}
                      className={`inline-flex items-center justify-center font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex-1 cursor-pointer gap-2 ${
                        isLive
                          ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white hover:from-[#B45309] hover:to-[#D97706] border border-[#F59E0B] shadow-sm'
                          : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:from-[#FBBF24] hover:to-[#E5A900] border border-[#F59E0B]'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>{isLive ? 'Join Live Class Now' : isScheduled ? 'Start / Enter Lecture' : 'Re-open Classroom'}</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => onCopyLink(cls.meetingCode)}
                      className="p-2.5 rounded-xl border border-[#F1E7CF] bg-white text-[#0F172A] hover:bg-[#FFF8E6] hover:border-[#FDE68A] transition-all cursor-pointer shadow-xs"
                      title="Copy meeting link"
                    >
                      {copiedCode === cls.meetingCode ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#D97706]" />
                      )}
                    </button>

                    {/* Download .ICS Button */}
                    <button
                      type="button"
                      onClick={() => onDownloadIcs(cls.meetingCode)}
                      className="p-2.5 rounded-xl border border-[#F1E7CF] bg-white text-[#0F172A] hover:bg-[#FFF8E6] hover:border-[#FDE68A] transition-all cursor-pointer shadow-xs"
                      title="Export to iCalendar (.ics)"
                    >
                      <Download className="w-4 h-4 text-[#D97706]" />
                    </button>
                  </div>

                  {/* Secondary Academic Telemetry Bar */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => onAttendanceSelect(cls.meetingCode)}
                      className="px-3 py-1.5 rounded-xl bg-[#FFFDF5] hover:bg-[#FFF8E6] border border-[#F1E7CF] hover:border-[#D99A00] text-[#B45309] font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Classroom Attendance & Telemetry</span>
                    </button>

                    <span className="text-[10px] font-mono text-[#64748B]">
                      WebRTC Encrypted
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CampusVerseOnlineClassesSection;
