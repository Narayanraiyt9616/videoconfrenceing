import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Video,
  Calendar,
  Plus,
  PlayCircle,
  BookOpen,
  Bell,
  HelpCircle,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { AuthModal } from '../auth/AuthModal.jsx';
import { UserProfileModal } from '../auth/UserProfileModal.jsx';
import { ScheduleMeetingModal } from '../meeting/ScheduleMeetingModal.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function Navbar({ onInstantMeetingStart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, notifications, markAllAsRead } = useNotifications ? useNotifications() : { unreadCount: 0, notifications: [] };

  const [timeString, setTimeString] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Real-time Academic Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      setTimeString(`${timeStr} • ${dateStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstantLecture = async () => {
    if (onInstantMeetingStart) {
      onInstantMeetingStart();
      return;
    }
    try {
      const res = await api.post('/api/meetings/instant', {
        title: user ? `${user.name}'s Live Classroom` : 'CampusVerse Live Lecture',
        isClassroom: true
      });
      if (res.success && (res.meeting?.code || res.meeting?.meetingCode)) {
        const code = res.meeting.code || res.meeting.meetingCode;
        navigate(`/room/${code}`);
      }
    } catch (err) {
      toast.error('Failed to start live lecture: ' + err.message);
    }
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Classes', path: '/dashboard?tab=classroom', icon: Video },
    { label: 'My Meetings', path: '/dashboard?tab=upcoming', icon: Calendar },
    { label: 'Recordings', path: '/dashboard?tab=recordings', icon: PlayCircle },
    { label: 'Study Resources', path: '/dashboard?tab=resources', icon: BookOpen }
  ];

  const canSchedule = user && ['faculty', 'admin'].includes(user.role);

  return (
    <>
      <nav className="sticky top-0 w-full h-16 px-4 sm:px-6 flex items-center justify-between bg-[#1E3A8A] text-white shadow-md z-40 select-none border-b border-[#172554]">
        {/* Left: Educational Logo & Brand */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0D9488] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white font-['Outfit']">CampusVerse</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[#0D9488] text-white">
                  Live
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] font-medium text-blue-200 tracking-normal -mt-0.5">
                Classroom Platform
              </span>
            </div>
          </Link>

          {/* Academic Clock Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 pl-4 border-l border-blue-800 text-xs text-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-300" />
            <span>{timeString}</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Items */}
        <div className="hidden md:flex items-center gap-1 bg-[#172554] p-1 rounded-xl border border-blue-900/60 shadow-inner">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname + location.search === item.path ||
              (item.path === '/dashboard' && location.pathname === '/dashboard' && !location.search);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Schedule Class Button (for authorized faculty/admin) */}
          {canSchedule && (
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0D9488] bg-teal-950/60 hover:bg-[#0D9488] hover:text-white border border-teal-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Class</span>
            </button>
          )}
        </div>

        {/* Right: Quick Action, Notifications, Help & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Start Live Lecture (Faculty/Admin) */}
          {canSchedule && (
            <button
              onClick={handleInstantLecture}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              title="Start a live classroom lecture right now"
            >
              <Video className="w-3.5 h-3.5 fill-current" />
              <span>Start Lecture</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E2E8F0] shadow-xl z-50 text-[#0F172A] p-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                    <p className="font-semibold text-[#1E3A8A]">Class Scheduled</p>
                    <p className="text-[#64748B] text-[11px] mt-0.5">A new lecture has been scheduled. Check your timetable for details.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-semibold text-[#0F172A]">Class Starting Soon</p>
                    <p className="text-[#64748B] text-[11px] mt-0.5">Your scheduled class is about to begin. Get ready to join.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 text-xs">
                    <p className="font-semibold text-[#0D9488]">Study Material Shared</p>
                    <p className="text-[#64748B] text-[11px] mt-0.5">Your faculty member has shared new study materials in CS402.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help & Support Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors cursor-pointer"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Account / Profile */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-inner">
                  {user.avatar || user.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-blue-200 capitalize font-medium">
                    {user.role || 'Student'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E2E8F0] shadow-2xl z-50 p-2 space-y-1 text-[#0F172A]"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#0F172A]">{user.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1E3A8A]">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>My Profile</span>
                  </button>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Classroom Dashboard</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin Management</span>
                    </Link>
                  )}

                  <div className="border-t border-[#E2E8F0] pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        toast.success('Signed out successfully.');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium rounded-lg text-[#DC2626] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1E3A8A] text-white border-b border-blue-900 px-4 py-3 space-y-2 animate-in slide-in-from-top">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                <Icon className="w-4 h-4 text-blue-300" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {canSchedule && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsScheduleOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#0D9488] bg-blue-900/60"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Class</span>
            </button>
          )}
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#1E3A8A]">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">CampusVerse Live Support</h3>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-[#0F172A]">
              <p>Welcome to CampusVerse Live virtual classroom. Here are quick tips to get started:</p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="font-bold text-[#1E3A8A]">Attending a Class:</p>
                  <p className="text-[#64748B]">Click "Join Live Class" or enter your 10-character class code from your course syllabus.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="font-bold text-[#0D9488]">Interactive Whiteboard & Materials:</p>
                  <p className="text-[#64748B]">During live lectures, use the Whiteboard and Study Materials buttons in the classroom control bar.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="font-bold text-[#0F172A]">Camera & Microphone:</p>
                  <p className="text-[#64748B]">Test your devices in the pre-join classroom lobby before entering.</p>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ScheduleMeetingModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
    </>
  );
}
