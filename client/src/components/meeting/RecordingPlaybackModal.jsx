import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, CheckCircle, Video, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

export function RecordingPlaybackModal({ isOpen, onClose, recordingBlob, durationSeconds, roomCode }) {
  const videoRef = useRef(null);

  if (!isOpen || !recordingBlob) return null;

  const videoUrl = URL.createObjectURL(recordingBlob);
  const sizeMb = (recordingBlob.size / (1024 * 1024)).toFixed(2);
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `meeting-recording-${roomCode || 'session'}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Recording download initiated! 📹');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-6 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Meeting Recording Preview</h3>
                <p className="text-xs text-[#9aa0a6]">
                  Duration: {formatTime(durationSeconds)} • Size: {sizeMb} MB
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

          {/* Video Preview Player */}
          <div className="my-4 rounded-xl overflow-hidden bg-black border border-[#3c4043] aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>

          {/* Details & Download action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#303134]">
            <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
              <HardDrive className="w-4 h-4 text-[#8ab4f8]" />
              <span>Full HD 1080p WebM media container with synchronized audio.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Recording</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
