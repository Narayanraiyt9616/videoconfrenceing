import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Trophy,
  HelpCircle,
  Check,
  X,
  RotateCcw,
  Target
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { triggerConfetti } from '../../utils/confetti.js';

export function ActiveGameOverlay() {
  const {
    currentGame,
    participants,
    participant,
    isHost,
    voteWhosMostLikely,
    revealWhosMostLikely
  } = useSocket();

  const [isDismissed, setIsDismissed] = useState(false);

  // Trigger confetti when Who's Most Likely winner is revealed
  useEffect(() => {
    if (currentGame?.type === 'whos_most_likely' && currentGame?.status === 'revealed') {
      triggerConfetti();
      setIsDismissed(false);
    }
  }, [currentGame]);

  // Reset dismiss state if a new game starts
  useEffect(() => {
    if (currentGame?.id) {
      setIsDismissed(false);
    }
  }, [currentGame?.id]);

  if (!currentGame || currentGame.type !== 'whos_most_likely' || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none font-sans">
      <AnimatePresence>
        <motion.div
          key={currentGame.id || 'wml'}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="p-5 rounded-2xl border border-[#333] bg-[#181818]/95 shadow-2xl backdrop-blur-xl pointer-events-auto relative"
        >
          {/* Close / Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize game"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between mb-2 pr-6">
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

          <h4 className="text-sm sm:text-base font-extrabold text-white text-center mb-3">
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
      </AnimatePresence>
    </div>
  );
}
