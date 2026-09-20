import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Vote, Plus, Trash2, Check, BarChart2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export function PollsModal({ isOpen, onClose }) {
  const { polls, createPoll, votePoll, participant } = useSocket();

  const [mode, setMode] = useState('list'); // 'list' | 'create'
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (val, index) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('Question likho pehle!');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error('Kam se kam 2 options hone chahiye!');
      return;
    }

    createPoll(question.trim(), cleanOptions);
    toast.success('Poll created successfully! 🗳️');
    setQuestion('');
    setOptions(['', '']);
    setMode('list');
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
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">ROOM POLLS</h3>
              <p className="text-[11px] text-zinc-400">Anonymous instant voting • Live percentage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 p-3 bg-[#181818] border-b border-[#262626] text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'list'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            ACTIVE POLLS ({polls.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'create'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            + CREATE POLL
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {mode === 'list' ? (
            polls.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-3xl mx-auto mb-3 text-[#ffa31a]">
                  📊
                </div>
                <p className="text-sm font-bold text-zinc-300 mb-1">No active polls</p>
                <p className="text-xs text-zinc-500 mb-4">
                  Create a poll to collect instant votes from everyone in the room.
                </p>
                <button
                  onClick={() => setMode('create')}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#ffa31a] hover:bg-[#ff9000] text-black cursor-pointer shadow-md"
                >
                  CREATE FIRST POLL
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => {
                  const totalVotes = poll.totalVotes || 0;

                  return (
                    <div
                      key={poll.id}
                      className="p-4 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="text-sm font-bold text-white">{poll.question}</h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#ffa31a]/15 text-[#ffa31a] border border-[#ffa31a]/30 shrink-0">
                          {totalVotes} VOTE{totalVotes === 1 ? '' : 'S'}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {poll.options.map((opt) => {
                          const optVotes = opt.votes ?? opt.votesCount ?? 0;
                          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                          const isSelected = opt.voters?.includes(participant?.id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => votePoll(poll.id, opt.id)}
                              className={`w-full relative p-2.5 rounded-xl border text-left overflow-hidden transition-all group cursor-pointer ${
                                isSelected
                                  ? 'border-[#ffa31a] bg-[#ffa31a]/15'
                                  : 'border-[#2e2e2e] hover:border-[#444] bg-[#141414]'
                              }`}
                            >
                              {/* Percentage Fill Bar */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 pointer-events-none ${
                                  isSelected ? 'bg-[#ffa31a]/25' : 'bg-white/5'
                                }`}
                                style={{ width: `${pct}%` }}
                              />

                              <div className="relative z-10 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#ffa31a] stroke-[3]" />}
                                  <span className={`font-semibold ${isSelected ? 'text-[#ffa31a]' : 'text-zinc-200'}`}>
                                    {opt.text}
                                  </span>
                                </div>
                                <span className="font-bold text-zinc-400 group-hover:text-white">
                                  {pct}% ({optVotes})
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Create Mode */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Poll Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sabse bada kaleshi kaun hai room me?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-xs focus:outline-none focus:border-[#ffa31a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Options (2 to 5)
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(e.target.value, idx)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-white text-xs focus:outline-none focus:border-[#ffa31a]"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 text-xs text-[#ffa31a] hover:text-[#ff9000] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ADD OPTION</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-lg transition-colors"
              >
                <span>PUBLISH POLL 🗳️</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
