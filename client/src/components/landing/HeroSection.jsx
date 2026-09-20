import React from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  LogIn,
  ShieldCheck,
  Zap,
  Play,
  Flame,
  Eye,
  Sparkles,
  Lock,
  Radio
} from 'lucide-react';
import { PrivacyBadge } from '../common/PrivacyBadge.jsx';

export function HeroSection({ onCreateClick, onJoinClick }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-8 pb-20 max-w-5xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center w-full"
      >
        {/* Top Verified / Live Pills */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-6 flex-wrap justify-center text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1c] border border-[#333333] text-[#ffa31a] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#ffa31a] animate-ping" />
            <span>LIVE P2P VIDEO STREAMING</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1c] border border-[#333333] text-white font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ffa31a]" />
            <span>VERIFIED ZERO-DATABASE PLATFORM</span>
          </div>
        </motion.div>

        {/* Signature Two-Tone Hub Logo Headline */}
        <motion.div variants={itemVariants} className="mb-4 select-none">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none flex items-center justify-center flex-wrap gap-2 sm:gap-3">
            <span className="text-white font-black tracking-tighter">KALESH</span>
            <span className="bg-[#ffa31a] text-black px-3 sm:px-5 py-1 sm:py-2 rounded-2xl sm:rounded-3xl font-black tracking-tight shadow-xl shadow-[#ffa31a]/30 inline-block">
              hub
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight"
        >
          Watch. Hangout. Kalesh.
        </motion.p>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-sm sm:text-base md:text-lg text-[#9e9e9e] max-w-xl mx-auto mb-8 leading-relaxed font-medium"
        >
          Free private group video calls, spicy Desi games, live memes, and anonymous roasts.
          <br />
          <span className="text-white font-semibold mt-1 block">
            100% ephemeral in RAM. No sign-up. No database. Nothing saved.
          </span>
        </motion.p>

        {/* Hub Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-black text-base tracking-wide flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-[#ffa31a]/30 transition-colors"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>START A KALESH ROOM</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onJoinClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#383838] hover:border-[#ffa31a] text-white font-black text-base tracking-wide flex items-center justify-center gap-3 cursor-pointer shadow-lg transition-all"
          >
            <LogIn className="w-5 h-5 text-[#ffa31a]" />
            <span>JOIN WITH CODE</span>
          </motion.button>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full text-left"
        >
          {/* Feature 1 */}
          <div className="p-4 rounded-xl bg-[#161616] border border-[#2b2b2b] hover:border-[#ffa31a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#ffa31a] uppercase tracking-wider">1080p HD</span>
              <Video className="w-4 h-4 text-[#ffa31a]" />
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">WebRTC Mesh Video</h4>
            <p className="text-xs text-[#8e8e8e] leading-relaxed">
              Crystal-clear audio and video streams connected directly peer-to-peer between your browsers.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-4 rounded-xl bg-[#161616] border border-[#2b2b2b] hover:border-[#ffa31a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#ffa31a] uppercase tracking-wider">HOT 🔥</span>
              <Sparkles className="w-4 h-4 text-[#ffa31a]" />
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">GIFs & Live Stickers</h4>
            <p className="text-xs text-[#8e8e8e] leading-relaxed">
              Upload any image/GIF without restrictions, or capture 2-second live reaction stickers from your camera.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-4 rounded-xl bg-[#161616] border border-[#2b2b2b] hover:border-[#ffa31a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#ffa31a] uppercase tracking-wider">TOP RATED</span>
              <Radio className="w-4 h-4 text-[#ffa31a]" />
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">Games & Live Polls</h4>
            <p className="text-xs text-[#8e8e8e] leading-relaxed">
              Who's Most Likely voting, spicy Truth or Dare prompts, anonymous consensus polls, and savage roasts.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-4 rounded-xl bg-[#161616] border border-[#2b2b2b] hover:border-[#ffa31a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#ffa31a] uppercase tracking-wider">100% PRIVATE</span>
              <Lock className="w-4 h-4 text-[#ffa31a]" />
            </div>
            <h4 className="text-sm font-extrabold text-white mb-1">Zero Database Storage</h4>
            <p className="text-xs text-[#8e8e8e] leading-relaxed">
              Nothing is saved. When the host terminates the room, all chat, streams, and votes vanish from RAM forever.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
