import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Calendar, Download, Share2, Shield, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export function MeetingDetailsModal({ isOpen, onClose, meeting, roomCode }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const code = roomCode || meeting?.meetingCode || meeting?.code || '';
  const meetingUrl = `${window.location.origin}/room/${code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    toast.success('Meeting link copied! 📋');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Meeting code copied! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIcs = () => {
    window.open(`/api/meetings/${code}/calendar.ics`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-6 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Meeting Information</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#303134] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Title & Host info */}
            <div>
              <h4 className="text-sm font-bold text-white">{meeting?.title || 'MeetHub Video Conference'}</h4>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Host: <span className="text-white font-medium">{meeting?.hostName || 'Host'}</span>
                {meeting?.isClassroom && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#1a73e8]/20 text-[#8ab4f8] text-[10px] font-bold">
                    Classroom
                  </span>
                )}
              </p>
            </div>

            {/* Meeting Code */}
            <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9aa0a6]">
                  Meeting Code
                </span>
                <span className="text-base font-mono font-bold text-[#8ab4f8]">{code}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-[#303134] hover:bg-[#3c4043] text-white transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-[#8ab4f8]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Shareable Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={meetingUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#141517] border border-[#3c4043] text-xs text-[#8ab4f8] font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full py-2.5 rounded-xl bg-[#282a2d] hover:bg-[#303134] border border-[#3c4043] text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#8ab4f8]" />
                <span>Add to Calendar (.ICS File)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
