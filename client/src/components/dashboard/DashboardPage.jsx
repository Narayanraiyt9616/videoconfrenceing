import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Download,
  Copy,
  Check,
  GraduationCap,
  Users,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Trash2,
  RefreshCw,
  Search,
  BookOpen,
  FileText,
  Presentation,
  PlayCircle,
  MessageSquare,
  Sparkles,
  Share2,
  ArrowRight,
  Filter,
  CheckCircle
} from 'lucide-react';
import { Navbar } from '../navbar/Navbar.jsx';
import { ScheduleMeetingModal } from '../meeting/ScheduleMeetingModal.jsx';
import { AttendanceModal } from '../meeting/AttendanceModal.jsx';
import { CampusVerseOnlineClassesSection } from '../classroom/CampusVerseOnlineClassesSection.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'upcoming' | 'classroom' | 'recordings' | 'resources' | 'attendance'
  const [meetings, setMeetings] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAttendanceCode, setSelectedAttendanceCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [quickCodeInput, setQuickCodeInput] = useState('');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const meetingsRes = await api.get('/api/meetings/my').catch(() => ({ success: false }));
      if (meetingsRes.success && meetingsRes.meetings) {
        setMeetings(meetingsRes.meetings);
      }

      const recsRes = await api.get('/api/recordings').catch(() => ({ success: false }));
      if (recsRes.success && recsRes.recordings) {
        setRecordings(recsRes.recordings);
      }
    } catch (err) {
      console.warn('[DashboardPage] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleCopy = (code) => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success('Classroom link copied! 📋');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadIcs = (code) => {
    window.open(`/api/meetings/${code}/calendar.ics`, '_blank');
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    const clean = quickCodeInput.trim().replace(/https?:\/\/[^/]+\/room\//i, '');
    if (!clean) {
      toast.error('Please enter a classroom code');
      return;
    }
    navigate(`/room/${clean}`);
  };

  const handleStartInstant = async () => {
    try {
      const res = await api.post('/api/meetings/instant', {
        title: user ? `${user.name}'s Live Lecture` : 'CampusVerse Live Lecture',
        isClassroom: true,
        courseCode: 'ACAD-LIVE'
      });
      const code = res.meeting?.code || res.meeting?.meetingCode;
      if (res.success && code) {
        toast.success('Live Classroom started!');
        navigate(`/room/${code}`);
      }
    } catch (err) {
      toast.error('Failed to start lecture: ' + err.message);
    }
  };

  const isFaculty = user && ['faculty', 'admin'].includes(user.role);

  // Computed Real Statistics
  const stats = useMemo(() => {
    const upcoming = meetings.filter((m) => m.status === 'scheduled').length;
    const live = meetings.filter((m) => m.status === 'ongoing').length;
    const completed = meetings.filter((m) => m.status === 'ended').length;
    const availableRecs = recordings.length;
    let totalParticipants = 0;
    meetings.forEach((m) => {
      if (Array.isArray(m.participantsHistory)) {
        totalParticipants += m.participantsHistory.length;
      }
    });
    return {
      upcoming,
      live,
      completed,
      availableRecs,
      totalParticipants
    };
  }, [meetings, recordings]);

  // Sample Educational Study Resources matching syllabus
  const studyResources = [
    {
      id: 'res-1',
      title: 'Distributed Systems: Raft Consensus Notes',
      subject: 'Distributed Systems',
      courseCode: 'CS402',
      sharedBy: 'Dr. Rajiv Sen',
      sharedDate: 'Oct 24, 2026',
      type: 'Lecture Notes',
      size: '2.4 MB'
    },
    {
      id: 'res-2',
      title: 'Database Normalization & Sharding Slides',
      subject: 'Database Engineering',
      courseCode: 'CS301',
      sharedBy: 'Prof. Vikram Malhotra',
      sharedDate: 'Oct 22, 2026',
      type: 'Presentation Slides',
      size: '5.1 MB'
    },
    {
      id: 'res-3',
      title: 'Computer Networks: WebRTC Mesh Protocol Paper',
      subject: 'Computer Networks',
      courseCode: 'CS305',
      sharedBy: 'Dr. Neha Verma',
      sharedDate: 'Oct 20, 2026',
      type: 'PDF Handout',
      size: '1.8 MB'
    },
    {
      id: 'res-4',
      title: 'Algorithms Tutorial 4: Dynamic Programming Sheet',
      subject: 'Data Structures & Algorithms',
      courseCode: 'CS201',
      sharedBy: 'Prof. Ananya Roy',
      sharedDate: 'Oct 19, 2026',
      type: 'Assignment Handout',
      size: '850 KB'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      {/* Top Academic Navigation Bar */}
      <Navbar onInstantMeetingStart={handleStartInstant} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner: Personalized Role Heading */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1E3A8A]">
                <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>
                  {isFaculty ? 'FACULTY INSTRUCTION PORTAL' : 'STUDENT ACADEMIC PORTAL'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-['Outfit'] tracking-tight">
                {isFaculty ? 'Teach, Inspire, and Connect' : 'Welcome to CampusVerse Live'}
              </h1>
              <p className="text-sm font-semibold text-[#2563EB]">
                {isFaculty ? 'Deliver engaging online lectures and create meaningful learning experiences for your students.' : 'Your Digital Classroom'}
              </p>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl">
                {isFaculty
                  ? 'Manage your live lecture schedule, review student attendance logs, share course materials, and broadcast crystal-clear video to your classes.'
                  : 'Everything you need to teach, learn, and collaborate in one place. Connect with faculty, attend live lectures, and revisit recordings.'}
              </p>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex flex-wrap items-center gap-3">
              {isFaculty ? (
                <>
                  <button
                    onClick={handleStartInstant}
                    className="px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Live Lecture</span>
                  </button>
                  <button
                    onClick={() => setIsScheduleOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Class</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleTabChange('classroom')}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Lecture</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Upcoming</p>
              <p className="text-xl font-bold text-[#0F172A]">{stats.upcoming}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Live Classes</p>
              <p className="text-xl font-bold text-[#16A34A]">{stats.live}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#64748B] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Completed</p>
              <p className="text-xl font-bold text-[#0F172A]">{stats.completed}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Recordings</p>
              <p className="text-xl font-bold text-[#0D9488]">{stats.availableRecs}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Enrolled</p>
              <p className="text-xl font-bold text-[#0F172A]">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="border-b border-[#E2E8F0] flex items-center gap-4 overflow-x-auto select-none">
          <button
            onClick={() => handleTabChange('overview')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Classroom Overview</span>
          </button>

          <button
            onClick={() => handleTabChange('classroom')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'classroom'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Live & Upcoming Classes</span>
            {stats.live > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('recordings')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'recordings'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Lecture Recordings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-[#0F172A]">
              {stats.availableRecs}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('resources')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'resources'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Resources</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW (THE 6 CORE REQUIRED DASHBOARD CARDS) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Six Educational Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CARD 1: Join Live Class */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <Video className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">Join Live Class</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Join your scheduled lectures and interactive learning sessions with high-definition video and collaborative tools.
                  </p>
                </div>
                <form onSubmit={handleQuickJoin} className="space-y-2 pt-2">
                  <input
                    type="text"
                    value={quickCodeInput}
                    onChange={(e) => setQuickCodeInput(e.target.value)}
                    placeholder="Enter Class Code (e.g. CS4-0210-LEC)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Join Classroom Lobby</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* CARD 2: Schedule a Class */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">Schedule a Class</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Create and organize upcoming lectures, tutorials, and academic discussions with automated calendar exports.
                  </p>
                </div>
                <div className="pt-2">
                  {isFaculty ? (
                    <button
                      onClick={() => setIsScheduleOpen(true)}
                      className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule New Class</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-[#64748B]">
                      Scheduled by faculty. Check your timetable for upcoming sessions.
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: My Classes */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#1E3A8A] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">My Classes</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    View your upcoming classes, ongoing sessions, and completed meetings along with attendance summaries.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('classroom')}
                    className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Class Timetable ({meetings.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </div>
              </div>

              {/* CARD 4: Class Recordings */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">Class Recordings</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Access available recorded lectures and revisit important lessons at your own pace whenever you need review.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('recordings')}
                    className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Access Recorded Archive ({recordings.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </div>
              </div>

              {/* CARD 5: Study Resources */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">Study Resources</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Access educational materials, shared slide decks, and classroom resources uploaded by course instructors.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('resources')}
                    className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Browse Shared Notes ({studyResources.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </div>
              </div>

              {/* CARD 6: Academic Discussions */}
              <div className="campus-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">Academic Discussions</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Collaborate with faculty and classmates on academic topics, raise questions, and join group study discussions.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleTabChange('classroom')}
                    className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Connect in Live Classroom</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Live Preview Section */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Recent & Ongoing Classes</h3>
                  <p className="text-xs text-[#64748B]">Immediate access to live lecture streams and timetable</p>
                </div>
                <button
                  onClick={() => handleTabChange('classroom')}
                  className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Classes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-4">
                {meetings.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <h4 className="text-sm font-bold text-[#0F172A]">No Upcoming Classes</h4>
                    <p className="text-xs text-[#64748B]">You have no upcoming classes. Check back later or review your class schedule.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meetings.slice(0, 4).map((m) => (
                      <div
                        key={m._id || m.meetingCode}
                        className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-slate-50/50 flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.status === 'ongoing'
                                ? 'bg-green-100 text-[#16A34A]'
                                : m.status === 'ended'
                                ? 'bg-slate-200 text-[#64748B]'
                                : 'bg-blue-100 text-[#1E3A8A]'
                            }`}>
                              {m.status === 'ongoing' ? 'Live Now' : m.status === 'ended' ? 'Completed' : 'Upcoming Class'}
                            </span>
                            {m.courseCode && (
                              <span className="text-[11px] font-mono font-bold text-[#2563EB]">
                                {m.courseCode}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-[#0F172A] line-clamp-1">{m.title}</h4>
                          <p className="text-xs text-[#64748B]">Faculty: {m.hostName || 'Professor'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(m.meetingCode)}
                            className="p-2 rounded-lg bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            title="Copy Class Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/room/${m.meetingCode}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold cursor-pointer"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE & UPCOMING CLASSES (CLASSROOM SECTION) */}
        {activeTab === 'classroom' && (
          <CampusVerseOnlineClassesSection
            meetings={meetings}
            loading={loading}
            onRefresh={fetchData}
            onScheduleOpen={() => setIsScheduleOpen(true)}
            onAttendanceSelect={(code) => setSelectedAttendanceCode(code)}
            onCopyLink={handleCopy}
            copiedCode={copiedCode}
            onDownloadIcs={handleDownloadIcs}
            onJoinMeeting={(code) => navigate(`/room/${code}`)}
            user={user}
          />
        )}

        {/* TAB 3: RECORDINGS */}
        {activeTab === 'recordings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A] font-['Outfit']">Lecture Recordings</h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">Revisit your lessons and strengthen your understanding at your own pace.</p>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Archive</span>
                </button>
              </div>

              <div className="pt-6">
                {recordings.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <PlayCircle className="w-10 h-10 text-[#94A3B8] mx-auto" />
                    <h4 className="text-base font-bold text-[#0F172A]">No Recordings Available</h4>
                    <p className="text-xs text-[#64748B]">There are no lecture recordings available yet. Live classroom recordings will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recordings.map((r) => (
                      <div
                        key={r._id || r.meetingCode}
                        className="campus-card p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-[#0D9488] border border-teal-200">
                              Recording Available
                            </span>
                            <span className="text-xs text-[#64748B] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.round((r.durationSeconds || 60) / 60)} mins
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#0F172A] line-clamp-2">{r.title}</h4>
                          <p className="text-xs text-[#64748B]">Faculty: {r.hostName || 'Course Instructor'}</p>
                          <p className="text-[11px] text-[#94A3B8]">
                            Recorded: {new Date(r.recordedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (r.fileUrl) {
                                window.open(r.fileUrl, '_blank');
                              } else {
                                toast.success('Starting high-definition lecture playback...');
                              }
                            }}
                            className="flex-1 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Play Recording</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STUDY RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="pb-6 border-b border-[#E2E8F0]">
                <h2 className="text-xl font-bold text-[#0F172A] font-['Outfit']">Study Materials & Resources</h2>
                <p className="text-xs sm:text-sm text-[#64748B]">Access learning materials shared by your faculty during online classes.</p>
              </div>

              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-xl border border-[#E2E8F0] bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-[#1E3A8A]">
                          {res.courseCode}
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B]">{res.type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{res.title}</h4>
                      <p className="text-xs text-[#64748B]">Faculty: {res.sharedBy} • {res.sharedDate}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
                      <span className="text-[#64748B] text-[11px]">{res.size}</span>
                      <button
                        onClick={() => toast.success(`Accessing ${res.title}`)}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Material</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Educational Modals */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onMeetingScheduled={(newMtg) => {
          fetchData();
          handleTabChange('classroom');
        }}
      />

      {selectedAttendanceCode && (
        <AttendanceModal
          meetingCode={selectedAttendanceCode}
          onClose={() => setSelectedAttendanceCode(null)}
        />
      )}
    </div>
  );
}
