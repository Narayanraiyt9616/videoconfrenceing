import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Zap,
  HelpCircle,
  Target,
  Skull,
  Shuffle,
  Gamepad2
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export function GamesModal({ isOpen, onClose }) {
  const {
    participants,
    participant,
    triggerRandomTopic,
    startWhosMostLikely,
    drawTruthOrDare,
    generateRoast
  } = useSocket();

  const [activeTab, setActiveTab] = useState('topic'); // 'topic' | 'wml' | 'tod' | 'roast'

  // Who's Most Likely state
  const [customWml, setCustomWml] = useState('');

  // Truth or Dare state
  const [todType, setTodType] = useState('truth');
  const [todTarget, setTodTarget] = useState('random');

  // Roast state
  const [roastTarget, setRoastTarget] = useState('');
  const [roastLevel, setRoastLevel] = useState('mild');

  if (!isOpen) return null;

  const handleStartTopic = () => {
    triggerRandomTopic();
    toast.success('Spicy debate topic dropped! 🔥');
    onClose();
  };

  const handleStartWml = () => {
    startWhosMostLikely(customWml.trim() || null);
    toast.success("Who's Most Likely challenge active! 🗳️");
    setCustomWml('');
    onClose();
  };

  const handleStartTod = () => {
    const targetId = todTarget === 'random' ? null : todTarget;
    drawTruthOrDare(todType, targetId);
    toast.success(`${todType.toUpperCase()} challenge ready! 🎭`);
    onClose();
  };

  const handleStartRoast = () => {
    const target = roastTarget || participant?.id;
    generateRoast(target, roastLevel);
    toast.success('Roast attack launched! 💀🔥');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg rounded-2xl bg-[#141414] border border-[#2e2e2e] shadow-2xl relative overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a]">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">PARTY GAMES & CHALLENGES</h3>
              <p className="text-[11px] text-zinc-400">Debates, group voting, truth or dare & roasts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#181818] border-b border-[#262626] gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('topic')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'topic'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Topic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wml')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'wml'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Most Likely</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tod')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'tod'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Truth/Dare</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roast')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'roast'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Roast</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* 1. Topic */}
          {activeTab === 'topic' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 text-[#ffa31a] flex items-center justify-center mx-auto text-3xl">
                🔥
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white mb-1">Aaj Ka Spicy Debate Topic</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Generates a hilarious, spicy Indian hangout debate prompt for everyone in the room.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartTopic}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>PICK RANDOM TOPIC 🔥</span>
              </button>
            </div>
          )}

          {/* 2. Who's Most Likely */}
          {activeTab === 'wml' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Custom Prompt (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for a funny desi prompt..."
                  value={customWml}
                  onChange={(e) => setCustomWml(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-xs focus:outline-none focus:border-[#ffa31a]"
                />
              </div>

              <p className="text-xs text-zinc-400">
                Everyone will receive an interactive voting card on screen to vote for who fits best.
              </p>

              <button
                type="button"
                onClick={handleStartWml}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>START WHO'S MOST LIKELY 🗳️</span>
              </button>
            </div>
          )}

          {/* 3. Truth or Dare */}
          {activeTab === 'tod' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTodType('truth')}
                  className={`py-3 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                    todType === 'truth'
                      ? 'bg-[#ffa31a] text-black border-[#ffa31a] shadow-md'
                      : 'bg-[#1c1c1c] border-[#2c2c2c] text-zinc-400 hover:text-white'
                  }`}
                >
                  🤫 TRUTH
                </button>
                <button
                  type="button"
                  onClick={() => setTodType('dare')}
                  className={`py-3 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                    todType === 'dare'
                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                      : 'bg-[#1c1c1c] border-[#2c2c2c] text-zinc-400 hover:text-white'
                  }`}
                >
                  ⚡ DARE
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Target Participant
                </label>
                <select
                  value={todTarget}
                  onChange={(e) => setTodTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-xs focus:outline-none focus:border-[#ffa31a]"
                >
                  <option value="random">🎲 Random Participant (Spin Bottle)</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name} {p.id === participant?.id ? '[YOU]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleStartTod}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <span>DRAW CHALLENGE 🎭</span>
              </button>
            </div>
          )}

          {/* 4. Roast Mode */}
          {activeTab === 'roast' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Target Friend 🎯
                </label>
                <select
                  value={roastTarget}
                  onChange={(e) => setRoastTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-xs focus:outline-none focus:border-[#ffa31a]"
                >
                  <option value="">Select target...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name} {p.id === participant?.id ? '[YOU]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Roast Spice Level 🌶️
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mild', label: 'Mild 🌶️', desc: 'Light tease' },
                    { id: 'savage', label: 'Savage 🔥', desc: 'No mercy' },
                    { id: 'maximum', label: 'Max Kalesh 💀', desc: 'Destruction' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setRoastLevel(lvl.id)}
                      className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                        roastLevel === lvl.id
                          ? 'bg-[#ffa31a]/20 border-[#ffa31a] text-[#ffa31a]'
                          : 'bg-[#1c1c1c] border-[#2c2c2c] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl.label}</div>
                      <div className="text-[10px] opacity-75">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartRoast}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Skull className="w-4 h-4" />
                <span>LAUNCH ROAST ATTACK 💀</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
