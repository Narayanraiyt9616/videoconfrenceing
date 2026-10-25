import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Lock,
  GraduationCap,
  Copy,
  Check,
  Download,
  Share2,
  ShieldCheck,
  BookOpen,
  User,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function ScheduleMeetingModal({ isOpen, onClose, onMeetingScheduled, defaultIsClassroom = true }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [classType, setClassType] = useState('Live Lecture');
  const [facultyName, setFacultyName] = useState(user?.name || 'Dr. Professor');
  const [description, setDescription] = useState('');
  
  // Date & Time
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Settings
  const [allowChat, setAllowChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [recordingAvailable, setRecordingAvailable] = useState(true);
  const [passcode, setPasscode] = useState('');

  const [loading, setLoading] = useState(false);
  const [scheduledResult, setScheduledResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (user?.name) setFacultyName(user.name);
    if (user?.department) setDepartment(user.department);
  }, [user]);

  if (!isOpen) return null;

  // Student permission guard
  if (user?.role === 'student') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#CBD5E1] text-center space-y-4 font-sans">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Faculty Permission Required</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Only verified faculty members and administrators can schedule university classes. You are currently authenticated with the Student role.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const classTypeOptions = [
    'Live Lecture',
    'Tutorial Session',
    'Doubt-Clearing Session',
    'Practical Demonstration',
    'Project Discussion',
    'Faculty Meeting',
    'Group Study',
    'Academic Seminar',
    'Guest Lecture'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role === 'student') {
      toast.error('Access denied. Student accounts are not permitted to schedule classes.');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a class title');
      return;
    }

    const startDate = new Date(date);
    if (isNaN(startDate.getTime())) {
      toast.error('Please select a valid class date and start time');
      return;
    }

    setLoading(true);
    try {
      const formattedTitle = subjectName.trim()
        ? `${subjectName.trim()}: ${title.trim()}`
        : title.trim();

      const res = await api.post('/api/meetings/schedule', {
        title: formattedTitle,
        description: description.trim() || `${classType} conducted by ${facultyName}`,
        scheduledStartTime: startDate.toISOString(),
        durationMinutes: parseInt(durationMinutes, 10),
        isClassroom: true,
        courseCode: courseCode.trim() || 'ACAD-LIVE',
        passcode: passcode.trim(),
        settings: {
          waitingRoomEnabled: waitingRoom,
          allowJoinerScreenShare: allowScreenShare,
          allowJoinerChat: allowChat,
          allowJoinerUnmute: true,
          classType,
          facultyName,
          department
        }
      });

      const meetingData = res.meeting || res;
      if (res.success && meetingData) {
        setScheduledResult(meetingData);
        toast.success('Class scheduled successfully! 📅');
        if (onMeetingScheduled) onMeetingScheduled(meetingData);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to schedule class');
    } finally {
      setLoading(false);
    }
  };

  const meetingCode = scheduledResult?.code || scheduledResult?.meetingCode || '';
  const meetingUrl = meetingCode ? `${window.location.origin}/room/${meetingCode}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    toast.success('Classroom link copied! 📋');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadIcs = () => {
    if (!meetingCode) return;
    window.open(`/api/meetings/${meetingCode}/calendar.ics`, '_blank');
  };

  const handleClose = () => {
    setScheduledResult(null);
    setTitle('');
    setSubjectName('');
    setCourseCode('');
    setDescription('');
    setPasscode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E3A8A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit']">Schedule a New Class</h3>
              <p className="text-xs text-blue-200">Organize your next lecture, tutorial, faculty meeting, or academic discussion.</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-blue-800 text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#0F172A]">
          {scheduledResult ? (
            /* Success confirmation view */
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 text-[#16A34A] mx-auto flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-[#0F172A]">Class Successfully Scheduled!</h4>
                <p className="text-xs text-[#64748B]">Share this link with your enrolled students or import into your timetable.</p>
              </div>

              {/* Classroom Code Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-3 max-w-md mx-auto text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#64748B]">Classroom Code:</span>
                  <span className="font-mono font-bold text-base text-[#1E3A8A]">{meetingCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#64748B]">Class Title:</span>
                  <span className="font-medium text-[#0F172A]">{scheduledResult.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#64748B]">Scheduled Start:</span>
                  <span className="font-medium text-[#0F172A]">
                    {new Date(scheduledResult.scheduledStartTime || date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Class Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .ICS</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold underline cursor-pointer"
                >
                  Done, return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Scheduling Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Class Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Class Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus & Raft Protocol"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 2. Subject Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Distributed Systems"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 3. Course Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS402"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 4. Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 5. Class Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Class Type</label>
                  <select
                    value={classType}
                    onChange={(e) => setClassType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  >
                    {classTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Faculty Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Faculty / Instructor Name</label>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 7. Class Date & Start Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Date & Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 8. Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 Hour)</option>
                    <option value="90">90 minutes (1.5 Hours)</option>
                    <option value="120">120 minutes (2 Hours)</option>
                  </select>
                </div>

                {/* 9. Description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Class Description & Syllabus Focus</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Topics to be covered, pre-requisite reading materials, or problem set review..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Classroom Permissions & Controls */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                  Classroom Controls & Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#0F172A]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowChat}
                      onChange={(e) => setAllowChat(e.target.checked)}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Allow Student Classroom Chat</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowScreenShare}
                      onChange={(e) => setAllowScreenShare(e.target.checked)}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Enable Screen Sharing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waitingRoom}
                      onChange={(e) => setWaitingRoom(e.target.checked)}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Enable Waiting Room (Door Knocking)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordingAvailable}
                      onChange={(e) => setRecordingAvailable(e.target.checked)}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Archive Recording to Portal</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Scheduling Class...' : 'Create Class'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
