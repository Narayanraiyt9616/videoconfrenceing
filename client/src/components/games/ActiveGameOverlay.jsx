import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  X,
  Crown,
  Trophy,
  HelpCircle,
  Check,
  RotateCcw,
  Target,
  Skull
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { triggerConfetti } from '../../utils/confetti.js';

export function ActiveGameOverlay() {
  const {
    currentGame,
    recentRoast,
    participants,
    participant,
    isHost,
    voteWhosMostLikely,
    revealWhosMostLikely,
    triggerRandomTopic
  } = useSocket();

  // Trigger confetti when Who's Most Likely winner is revealed
  useEffect(() => {
    if (currentGame?.type === 'whos_most_likely' && currentGame?.status === 'revealed') {
      triggerConfetti();
    }
  }, [currentGame]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-none font-sans">
      <AnimatePresence>
        {/* 1. Spicy Topic Banner */}
        {currentGame?.type === 'topic' && (
          <motion.div
            key="topic"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-4 sm:p-5 rounded-2xl border border-[#ffa31a]/40 bg-[#181818]/95 shadow-2xl backdrop-blur-xl pointer-events-auto text-center"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ffa31a] text-black">
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>SPICY DEBATE TOPIC</span>
              </div>
              <button
                onClick={triggerRandomTopic}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Shuffle topic"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white leading-snug">
              "{currentGame.topic}"
            </p>
          </motion.div>
        )}

        {/* 2. Who's Most Likely Game Card */}
        {currentGame?.type === 'whos_most_likely' && (
          <motion.div
            key={currentGame.id || 'wml'}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-5 rounded-2xl border border-[#333] bg-[#181818]/95 shadow-2xl backdrop-blur-xl pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ffa31a] text-black">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>WHO'S MOST LIKELY?</span>
              </div>
              <div className="text-xs font-semibold text-zinc-400">
                {currentGame.status === 'voting' ? (
                  <span>
                    VOTES: {currentGame.votesCount || Object.keys(currentGame.votes || {}).length} /{' '}
                    {participants.length}
                  </span>
                ) : (
                  <span className="text-[#ffa31a] font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    WINNER REVEALED!
                  </span>
                )}
              </div>
            </div>

            <h4 className="text-sm sm:text-base font-extrabold text-white text-center mb-4">
              "{currentGame.question}"
            </h4>

            {/* Voting State */}
            {currentGame.status === 'voting' ? (
              <div>
                <p className="text-xs text-zinc-400 text-center mb-3">Vote for a participant below:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {participants.map((p) => {
                    const hasMyVote = currentGame.votes?.[participant?.id] === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => voteWhosMostLikely(p.id)}
                        className={`p-2.5 rounded-xl flex items-center gap-2 border transition-all text-left cursor-pointer ${
                          hasMyVote
                            ? 'bg-[#ffa31a]/15 border-[#ffa31a] text-white'
                            : 'bg-[#202020] border-[#303030] hover:border-zinc-500 text-zinc-200'
                        }`}
                      >
                        <span className="text-xl">{p.avatar}</span>
                        <div className="truncate flex-1">
                          <div className="text-xs font-bold truncate">{p.name}</div>
                          {hasMyVote && (
                            <span className="text-[10px] text-[#ffa31a] flex items-center gap-0.5 font-bold">
                              <Check className="w-3 h-3 stroke-[3]" /> Voted
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isHost && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={revealWhosMostLikely}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#ffa31a] hover:bg-[#ff9000] text-black cursor-pointer shadow-md"
                    >
                      Host: Reveal Results ⏱️
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Revealed State */
              <div className="text-center py-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className="w-20 h-20 rounded-2xl bg-[#ffa31a]/20 border-2 border-[#ffa31a] flex items-center justify-center text-4xl mx-auto mb-2 relative shadow-xl"
                >
                  <Crown className="w-6 h-6 text-[#ffa31a] absolute -top-3 -right-1 fill-[#ffa31a] animate-bounce" />
                  {currentGame.winner?.avatar || '👑'}
                </motion.div>
                <div className="text-lg font-black text-white mb-1">
                  {currentGame.winner?.name || 'Everyone'} won!
                </div>
                <p className="text-xs text-[#ffa31a] font-semibold">
                  Total {currentGame.maxVotes || 0} votes recorded!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* 3. Truth or Dare Prompt Card */}
        {currentGame?.type === 'truth_or_dare' && (
          <motion.div
            key="tod"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-5 rounded-2xl border shadow-2xl backdrop-blur-xl pointer-events-auto text-center ${
              currentGame.mode === 'dare'
                ? 'border-red-500/50 bg-[#1c1414]/95'
                : 'border-[#ffa31a]/50 bg-[#181818]/95'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  currentGame.mode === 'dare'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#ffa31a] text-black'
                }`}
              >
                {currentGame.mode === 'dare' ? '⚡ DARE CHALLENGE' : '🤫 TRUTH CHALLENGE'}
              </span>

              {currentGame.target && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#262626] border border-[#3e3e3e] text-white">
                  <span>{currentGame.target.avatar}</span>
                  <span>Target: {currentGame.target.name}</span>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base font-extrabold text-white leading-snug my-2">
              "{currentGame.prompt}"
            </p>
          </motion.div>
        )}

        {/* 4. Recent Roast Alert */}
        {recentRoast && (
          <motion.div
            key={recentRoast.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 rounded-2xl border border-red-500/40 bg-gradient-to-r from-[#181818] via-[#2a1414] to-[#181818] shadow-2xl backdrop-blur-xl pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">💀</span>
                <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider">
                  ROAST ATTACK ({recentRoast.level})
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">By {recentRoast.senderName}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white italic leading-relaxed">
              "{recentRoast.roastText}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
