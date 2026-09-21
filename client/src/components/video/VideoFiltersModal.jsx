import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Wand2, Check } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export const VIDEO_FILTERS = [
  { id: 'none', name: 'Normal', css: 'filter-none', badge: 'Original', desc: 'Natural clean feed' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', css: 'filter-cyberpunk', badge: 'Vivid', desc: 'Cyan & magenta night city' },
  { id: 'vintage', name: 'Retro Vintage', css: 'filter-vintage', badge: '90s Film', desc: 'Warm nostalgic sepia tone' },
  { id: 'noir', name: 'Noir Cinema', css: 'filter-noir', badge: 'B&W', desc: 'High contrast monochrome' },
  { id: 'matrix', name: 'Matrix Terminal', css: 'filter-matrix', badge: 'Hacker', desc: 'Phosphor green matrix look' },
  { id: 'vaporwave', name: 'Sunset Vaporwave', css: 'filter-vaporwave', badge: 'Aesthetic', desc: 'Violet & magenta dream' },
  { id: 'beauty', name: 'Beauty Bloom', css: 'filter-beauty', badge: 'Smooth', desc: 'Soft glow skin illumination' },
  { id: 'invert', name: 'Thermal X-Ray', css: 'filter-invert', badge: 'Sci-Fi', desc: 'Inverted chromatic negative' },
  { id: 'golden', name: 'Golden Hour', css: 'filter-golden', badge: 'Warm', desc: 'Sunset amber radiance' },
  { id: 'frost', name: 'Frost Cold', css: 'filter-frost', badge: 'Icy', desc: 'Cool blue cinematic tone' },
  { id: 'blur', name: 'Privacy Blur', css: 'filter-blur', badge: 'Privacy', desc: 'Gaussian blur for privacy' }
];

export function VideoFiltersModal({ isOpen, onClose, localStream }) {
  const { activeVideoFilter, setLocalVideoFilter } = useSocket();
  const [selectedFilter, setSelectedFilter] = useState(activeVideoFilter || 'none');
  const previewVideoRef = useRef(null);

  useEffect(() => {
    if (activeVideoFilter) {
      setSelectedFilter(activeVideoFilter);
    }
  }, [activeVideoFilter]);

  // Bind local stream to preview video
  useEffect(() => {
    if (previewVideoRef.current && localStream) {
      previewVideoRef.current.srcObject = localStream;
      previewVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isOpen]);

  if (!isOpen) return null;

  const currentFilterObj = VIDEO_FILTERS.find((f) => f.id === selectedFilter) || VIDEO_FILTERS[0];

  const handleApply = (filterId) => {
    setSelectedFilter(filterId);
    setLocalVideoFilter(filterId);
    toast.success(`Video filter set: ${VIDEO_FILTERS.find((f) => f.id === filterId)?.name || 'None'} ✨`, {
      icon: '🪄'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#2b2b2b] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#242424] flex items-center justify-between bg-[#181818]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a] shadow-inner">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  VIDEO FILTERS & EFFECTS
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ffa31a] text-black uppercase tracking-wider">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Choose a camera filter — everyone in the meeting will see it live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#2e2e2e] border border-[#333333] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Live Preview & Filter Selection Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Live Preview Monitor */}
          <div className="relative w-full aspect-video max-h-56 sm:max-h-64 rounded-xl overflow-hidden bg-black border border-[#333333] shadow-inner flex items-center justify-center">
            {localStream ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-all duration-300 ${currentFilterObj.css}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Sparkles className="w-8 h-8 text-[#ffa31a] mb-2 animate-pulse" />
                <span className="text-xs font-bold text-zinc-400">Camera preview unavailable</span>
              </div>
            )}

            {/* Filter Name Badge on Preview */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/80 border border-[#333333] backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffa31a] animate-ping" />
              <span className="text-xs font-bold text-white">{currentFilterObj.name}</span>
              <span className="text-[10px] text-[#ffa31a] font-black uppercase">
                {currentFilterObj.badge}
              </span>
            </div>
          </div>

          {/* Filter Cards Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Select Video Filter
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {VIDEO_FILTERS.map((filter) => {
                const isActive = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleApply(filter.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group shadow-sm ${
                      isActive
                        ? 'bg-[#ffa31a]/15 border-[#ffa31a] shadow-[0_0_15px_rgba(255,163,26,0.25)] ring-1 ring-[#ffa31a]'
                        : 'bg-[#1a1a1a] hover:bg-[#222222] border-[#2c2c2c] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#252525] text-zinc-300 uppercase tracking-wider group-hover:text-white">
                        {filter.badge}
                      </span>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-[#ffa31a] text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors">
                        {filter.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{filter.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#242424] bg-[#181818]/90 flex items-center justify-between">
          <button
            onClick={() => handleApply('none')}
            className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-zinc-300 hover:text-white border border-[#333333] text-xs font-bold transition-colors cursor-pointer"
          >
            Reset to Normal
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs transition-colors shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
