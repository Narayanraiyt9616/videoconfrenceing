import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, X, ShieldAlert } from 'lucide-react';

export function LeaveClassModal({
  isOpen,
  isHost,
  onClose,
  onLeaveOnly,
  onEndForEveryone
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Leave Classroom?</h3>
                <p className="text-xs text-[#64748B]">CampusVerse Live Virtual Session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-[#0F172A] leading-relaxed">
              Are you sure you want to leave this live class?
            </p>

            {isHost && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Faculty Host Controls</span>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  As the faculty host, you can leave the classroom while allowing students to remain, or end the lecture for all attendees.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-colors cursor-pointer"
            >
              Stay in Class
            </button>

            <button
              type="button"
              onClick={onLeaveOnly}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Leave Class
            </button>

            {isHost && (
              <button
                type="button"
                onClick={onEndForEveryone}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="End class for everyone and save attendance records"
              >
                End Class for All
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
