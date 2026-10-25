import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, register, isLoading } = useAuth();

  // Parse redirect query param: e.g. /login?redirect=/dashboard
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');

  // If already logged in, automatically navigate to redirect target
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTarget]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate(redirectTarget, { replace: true });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    const res = await register({
      name,
      email,
      password,
      role,
      avatar: role === 'faculty' ? '🎓' : '🎒',
      department
    });
    setSubmitting(false);

    if (res.success) {
      navigate(redirectTarget, { replace: true });
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setSubmitting(true);
    const res = await login(demoEmail, demoPassword);
    setSubmitting(false);

    if (res.success) {
      navigate(redirectTarget, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      {/* Top Academic Navbar */}
      <header className="w-full bg-[#1E3A8A] border-b border-[#172554] px-4 sm:px-8 py-3.5 flex items-center justify-between text-white shadow-sm">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0D9488] flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight font-['Outfit']">CampusVerse</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-[#0D9488] text-white">
                Live
              </span>
            </div>
            <span className="text-[10px] text-blue-200 -mt-0.5 font-medium">Virtual Classroom Portal</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-blue-200 hover:text-white transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Login / Registration Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#CBD5E1] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#F8FAFC] to-white p-6 border-b border-[#E2E8F0] text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-md mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {activeTab === 'login' ? 'Sign in to CampusVerse Live' : 'Create Campus Account'}
              </h1>
              <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto">
                {activeTab === 'login'
                  ? 'Access your digital classroom, live lectures, and study resources.'
                  : 'Join university faculty, researchers, and students in HD lectures.'}
              </p>

              {/* Tab Selector */}
              <div className="flex items-center rounded-xl bg-[#F1F5F9] p-1 mt-5 border border-[#CBD5E1]">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  New Registration
                </button>
              </div>
            </div>

            {/* Quick 1-Click Academic Demo Sign-In */}
            <div className="p-4 sm:p-6 pb-2">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 mb-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Instant 1-Click Role Login:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('prof.sharma@meethub.com', 'prof123')}
                    className="p-2 rounded-xl bg-white hover:bg-[#1E3A8A] hover:text-white border border-[#CBD5E1] text-[11px] font-bold text-[#0F172A] transition-all text-center flex flex-col items-center gap-0.5 shadow-2xs group cursor-pointer"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🎓</span>
                    <span>Faculty</span>
                    <span className="text-[9px] text-[#64748B] group-hover:text-blue-100 font-normal">
                      Host Lectures
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('student@meethub.com', 'student123')}
                    className="p-2 rounded-xl bg-white hover:bg-[#2563EB] hover:text-white border border-[#CBD5E1] text-[11px] font-bold text-[#0F172A] transition-all text-center flex flex-col items-center gap-0.5 shadow-2xs group cursor-pointer"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🎒</span>
                    <span>Student</span>
                    <span className="text-[9px] text-[#64748B] group-hover:text-blue-100 font-normal">
                      Classroom
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('admin@meethub.com', 'admin123')}
                    className="p-2 rounded-xl bg-white hover:bg-[#0D9488] hover:text-white border border-[#CBD5E1] text-[11px] font-bold text-[#0F172A] transition-all text-center flex flex-col items-center gap-0.5 shadow-2xs group cursor-pointer"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">👑</span>
                    <span>Admin</span>
                    <span className="text-[9px] text-[#64748B] group-hover:text-teal-100 font-normal">
                      Full Portal
                    </span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              {activeTab === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Academic Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. faculty@university.edu"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Classroom</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Sarah Johnson or Rohan Gupta"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Academic Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@university.edu"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* University Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      University Role *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          role === 'student'
                            ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
                            : 'border-[#CBD5E1] text-[#64748B] hover:bg-slate-50'
                        }`}
                      >
                        <span>🎒</span>
                        <span>Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('faculty')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          role === 'faculty'
                            ? 'bg-[#1E3A8A]/10 border-[#1E3A8A] text-[#1E3A8A]'
                            : 'border-[#CBD5E1] text-[#64748B] hover:bg-slate-50'
                        }`}
                      >
                        <span>🎓</span>
                        <span>Faculty</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Department or Major (Optional)
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Security Notice */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center text-[11px] text-[#64748B] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>CampusVerse Encrypted Authentication • Protected Session</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#64748B] border-t border-[#CBD5E1]">
        © 2026 CampusVerse Live • Educational Video Conferencing
      </footer>
    </div>
  );
}
