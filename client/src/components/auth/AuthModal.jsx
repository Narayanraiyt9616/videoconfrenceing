import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, GraduationCap, Shield, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💻', '🎓', '👑', '🚀', '🔥', '🧠', '⚡', '🦉', '💼'];

export function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [avatar, setAvatar] = useState('👨‍💻');
  const [department, setDepartment] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      role,
      avatar,
      department
    });
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setLoading(true);
    const res = await login(demoEmail, demoPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-6 text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#303134]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center font-bold text-white shadow-md">
                M
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'login' ? 'Sign in to MeetHub' : 'Create MeetHub Account'}
                </h3>
                <p className="text-xs text-[#9aa0a6]">
                  {activeTab === 'login'
                    ? 'Access scheduled meetings, history & classes'
                    : 'Join faculty, students, and teams in HD meetings'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#303134] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Demo Sign-in Bar */}
          <div className="mt-4 p-3 rounded-xl bg-[#282a2d] border border-[#3c4043]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8ab4f8] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant 1-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('admin@meethub.com', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-[#303134] hover:bg-[#1a73e8] hover:text-white border border-[#444746] text-[11px] font-bold text-zinc-300 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>👑 Admin</span>
                <span className="text-[9px] text-[#9aa0a6] font-normal">Full Control</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('prof.sharma@meethub.com', 'prof123')}
                className="px-2 py-1.5 rounded-lg bg-[#303134] hover:bg-[#1a73e8] hover:text-white border border-[#444746] text-[11px] font-bold text-zinc-300 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>🎓 Faculty</span>
                <span className="text-[9px] text-[#9aa0a6] font-normal">Teacher Role</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('student@meethub.com', 'student123')}
                className="px-2 py-1.5 rounded-lg bg-[#303134] hover:bg-[#1a73e8] hover:text-white border border-[#444746] text-[11px] font-bold text-zinc-300 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>🚀 Student</span>
                <span className="text-[9px] text-[#9aa0a6] font-normal">Classroom</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center rounded-xl bg-[#282a2d] p-1 mt-4 border border-[#3c4043]">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-[#1a73e8] text-white shadow-md'
                  : 'text-[#9aa0a6] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-[#1a73e8] text-white shadow-md'
                  : 'text-[#9aa0a6] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              {/* Role selection for Education features */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    role === 'user'
                      ? 'border-[#8ab4f8] bg-[#1a73e8]/20 text-white font-bold'
                      : 'border-[#3c4043] bg-[#282a2d] text-[#9aa0a6]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-[#8ab4f8]" />
                  <span className="text-[11px] block">General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    role === 'faculty'
                      ? 'border-[#8ab4f8] bg-[#1a73e8]/20 text-white font-bold'
                      : 'border-[#3c4043] bg-[#282a2d] text-[#9aa0a6]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 mx-auto mb-1 text-[#8ab4f8]" />
                  <span className="text-[11px] block">Faculty</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    role === 'student'
                      ? 'border-[#8ab4f8] bg-[#1a73e8]/20 text-white font-bold'
                      : 'border-[#3c4043] bg-[#282a2d] text-[#9aa0a6]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-[#8ab4f8]" />
                  <span className="text-[11px] block">Student</span>
                </button>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-[#bdc1c6] mb-1">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm transition-all ${
                        avatar === a
                          ? 'bg-[#1a73e8] border border-white scale-110 shadow-sm'
                          : 'bg-[#282a2d] border border-[#3c4043] hover:border-[#8ab4f8]'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
