import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Download, RefreshCw, GraduationCap, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function AttendanceModal({ isOpen, onClose, roomCode, isHost }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/meetings/${roomCode}/attendance`);
      if (res.success && res.attendance) {
        setAttendance(res.attendance);
      }
    } catch (err) {
      console.warn('[AttendanceModal] Could not fetch attendance:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, roomCode]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    window.open(`/api/meetings/${roomCode}/attendance/export`, '_blank');
    toast.success('Attendance CSV downloaded! 📊');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-6 text-white max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#34a853] flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Classroom Attendance Tracker</h3>
                <p className="text-xs text-[#9aa0a6]">
                  Meeting Code: <span className="text-[#8ab4f8] font-mono">{roomCode}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAttendance}
                disabled={loading}
                className="p-2 rounded-lg bg-[#282a2d] hover:bg-[#303134] text-[#9aa0a6] hover:text-white transition-colors"
                title="Refresh Attendance"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#303134] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] text-center">
              <span className="text-xs text-[#9aa0a6] block">Total Participants</span>
              <span className="text-lg font-bold text-white">{attendance.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] text-center">
              <span className="text-xs text-[#9aa0a6] block">Present Now</span>
              <span className="text-lg font-bold text-[#34a853]">
                {attendance.filter((a) => !a.leftAt).length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] text-center">
              <span className="text-xs text-[#9aa0a6] block">Export Ready</span>
              <span className="text-lg font-bold text-[#8ab4f8]">CSV / Excel</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-[#3c4043] bg-[#141517]">
            {attendance.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#9aa0a6]">
                No attendance records logged yet for this session.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#282a2d] text-[#bdc1c6] border-b border-[#3c4043] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Joined</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282a2d]">
                  {attendance.map((record, i) => (
                    <tr key={record._id || i} className="hover:bg-[#202124] transition-colors">
                      <td className="py-2 px-3 font-semibold text-white">
                        {record.participantName}
                        {record.participantEmail && (
                          <span className="block text-[10px] text-[#9aa0a6] font-normal">
                            {record.participantEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#303134] text-[#8ab4f8]">
                          {record.role || 'Student'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#9aa0a6]">
                        {new Date(record.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 text-[#bdc1c6]">
                        {record.durationMinutes || 0} mins
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !record.leftAt
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {!record.leftAt ? '🟢 Active' : '⚪ Left'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer action */}
          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-[#9aa0a6]">
              All join and leave timestamps are automatically audited by server.
            </span>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-[#34a853] hover:bg-[#2d9249] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
