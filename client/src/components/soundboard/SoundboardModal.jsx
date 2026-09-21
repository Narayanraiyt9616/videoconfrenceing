import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Pause,
  Trash2,
  Lock,
  Sparkles,
  Music,
  Plus
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { soundFx } from '../../utils/soundFx.js';
import toast from 'react-hot-toast';

const PRESET_SOUNDS = [
  { id: 'airhorn', name: 'Air Horn', emoji: '📢', category: 'Hype' },
  { id: 'rimshot', name: 'Ba-Dum Tss', emoji: '🥁', category: 'Funny' },
  { id: 'sad_trombone', name: 'Sad Trombone', emoji: '🎺', category: 'Fail' },
  { id: 'cricket', name: 'Cricket Chirp', emoji: '🦗', category: 'Awkward' },
  { id: 'applause', name: 'Applause', emoji: '👏', category: 'Hype' },
  { id: 'laugh', name: 'Laugh Track', emoji: '😂', category: 'Funny' },
  { id: 'quack', name: 'Duck Quack', emoji: '🦆', category: 'Funny' },
  { id: 'siren', name: 'Kalesh Siren', emoji: '🚨', category: 'Drama' },
  { id: 'boing', name: 'Boing Spring', emoji: '💥', category: 'Funny' },
  { id: 'dun_dun_dun', name: 'Dun Dun Dun!', emoji: '😱', category: 'Drama' },
  { id: 'anime_wow', name: 'Anime Wow', emoji: '✨', category: 'Hype' },
  { id: 'bruh', name: 'Bruh Moment', emoji: '💀', category: 'Meme' }
];

const QUICK_EMOJIS = ['🔊', '📢', '🔥', '😂', '💀', '🎺', '🥁', '🚨', '💥', '🥳', '🍿', '⚡'];

export function SoundboardModal({ isOpen, onClose }) {
  const {
    playSoundEffect,
    uploadCustomSound,
    deleteCustomSound,
    customSounds,
    roomSettings,
    isHost,
    participant
  } = useSocket();

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [volume, setVolume] = useState(soundFx.volume);
  const [isMuted, setIsMuted] = useState(soundFx.muted);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadEmoji, setUploadEmoji] = useState('🔊');
  const [audioData, setAudioData] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const isLocked = !roomSettings?.allowJoinerSoundboard && !isHost;

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundFx.setVolume(val);
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handlePlayPreset = (preset) => {
    if (isLocked) {
      toast.error('Host has disabled soundboard for joiners!');
      return;
    }
    playSoundEffect({
      soundId: preset.id,
      soundName: preset.name,
      soundEmoji: preset.emoji,
      isCustom: false
    });
  };

  const handlePlayCustom = (sound) => {
    if (isLocked) {
      toast.error('Host has disabled soundboard for joiners!');
      return;
    }
    playSoundEffect({
      soundId: sound.id,
      soundName: sound.name,
      soundEmoji: sound.emoji,
      soundUrl: sound.audioData,
      isCustom: true
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      toast.error('Audio file too large! Maximum 2.5MB allowed.');
      return;
    }

    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name)) {
      toast.error('Please select a valid audio file (.mp3, .wav, .ogg, .m4a)');
      return;
    }

    setAudioFileName(file.name);
    if (!uploadName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 24);
      setUploadName(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAudioData(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePreview = () => {
    if (!audioData) return;

    if (previewing) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewing(false);
    } else {
      const audio = new Audio(audioData);
      audio.volume = volume;
      audio.onended = () => setPreviewing(false);
      audio.play().catch(() => setPreviewing(false));
      previewAudioRef.current = audio;
      setPreviewing(true);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!audioData) {
      toast.error('Please choose an audio file first!');
      return;
    }
    if (!uploadName.trim()) {
      toast.error('Please enter a name for the sound effect!');
      return;
    }

    try {
      setIsUploading(true);
      await uploadCustomSound({
        name: uploadName.trim(),
        emoji: uploadEmoji,
        audioData
      });
      toast.success('Sound uploaded! Everyone in the meet can now play it 🔥');
      setUploadName('');
      setAudioData(null);
      setAudioFileName('');
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.message || 'Failed to upload sound');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSound = async (soundId) => {
    try {
      await deleteCustomSound(soundId);
      toast.success('Custom sound removed from room.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete sound');
    }
  };

  const categories = ['All', 'Hype', 'Funny', 'Drama', 'Fail', 'Awkward', 'Meme'];

  const filteredPresets = selectedCategory === 'All'
    ? PRESET_SOUNDS
    : PRESET_SOUNDS.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#2b2b2b] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#242424] flex items-center justify-between bg-[#181818]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a] shadow-inner">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  DISCORD SOUNDBOARD
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ffa31a] text-black uppercase tracking-wider">
                  LIVE BROADCAST
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Trigger sound effects for everyone in the kalesh meet
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

        {/* Lock Warning if Joiner & Soundboard Disallowed */}
        {isLocked && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Lock className="w-4 h-4 shrink-0 text-[#ffa31a]" />
            <span>Host has currently restricted the soundboard to host-only. Joiners cannot trigger sounds.</span>
          </div>
        )}

        {/* Controls Bar: Tabs & Volume */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#242424] bg-[#121212] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-[#ffa31a] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets ({PRESET_SOUNDS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-[#ffa31a] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Custom Sounds ({customSounds.length})</span>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-[#222222] border-[#333333] text-zinc-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 accent-[#ffa31a] cursor-pointer"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: PRESET SOUNDS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#ffa31a]/20 border border-[#ffa31a] text-[#ffa31a]'
                        : 'bg-[#1a1a1a] border border-[#2b2b2b] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePlayPreset(preset)}
                    disabled={isLocked}
                    className="p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] active:scale-95 border border-[#2c2c2c] hover:border-[#ffa31a] flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-md disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                      {preset.emoji}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors truncate max-w-full">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                      {preset.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM UPLOAD SOUNDS */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Upload Card */}
              <div className="p-4 rounded-xl bg-[#181818] border border-[#2e2e2e] space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#ffa31a]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Upload Custom Sound Effect
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400">Max 2.5MB • In-Memory</span>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-3">
                  {/* File Picker & Emoji & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Emoji selector */}
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#121212] border border-[#333333]">
                      <span className="text-xl">{uploadEmoji}</span>
                      <div className="flex-1 flex gap-1 overflow-x-auto py-1">
                        {QUICK_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setUploadEmoji(em)}
                            className="p-1 rounded hover:bg-[#252525] text-xs cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sound Name Input */}
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Sound name (e.g., Arey Bhai Bhai)"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        maxLength={30}
                        className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#333333] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffa31a]"
                      />
                    </div>
                  </div>

                  {/* Audio File Input & Preview Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="custom-sound-file"
                    />

                    <label
                      htmlFor="custom-sound-file"
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-[#222222] hover:bg-[#2b2b2b] border border-[#383838] text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer truncate"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#ffa31a]" />
                      <span className="truncate">
                        {audioFileName || 'Choose Audio File (.mp3, .wav, .ogg)'}
                      </span>
                    </label>

                    {/* Preview Button */}
                    {audioData && (
                      <button
                        type="button"
                        onClick={handleTogglePreview}
                        className="px-3 py-2 rounded-xl bg-[#282828] hover:bg-[#333333] border border-[#444444] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {previewing ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-[#ffa31a]" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#ffa31a]" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading || !audioData}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {isUploading ? 'Uploading...' : 'Add to Room 🚀'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Room Custom Sounds Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Room Sounds ({customSounds.length})
                  </h4>
                  <span className="text-[11px] text-zinc-400">Click to play across the room</span>
                </div>

                {customSounds.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#161616] border border-[#262626]">
                    <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-zinc-400">No custom sounds added yet!</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Upload any audio clip above to let everyone in the kalesh use it.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customSounds.map((sound) => {
                      const canDelete = isHost || sound.uploadedBy?.id === participant?.id;
                      return (
                        <div
                          key={sound.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#202020] border border-[#2e2e2e] transition-all group"
                        >
                          <button
                            type="button"
                            onClick={() => handlePlayCustom(sound)}
                            disabled={isLocked}
                            className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {sound.emoji || '🔊'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-[#ffa31a] transition-colors truncate">
                                {sound.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">
                                By {sound.uploadedBy?.name || 'Friend'}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              type="button"
                              onClick={() => handlePlayCustom(sound)}
                              disabled={isLocked}
                              className="p-2 rounded-lg bg-[#252525] hover:bg-[#ffa31a] hover:text-black text-[#ffa31a] transition-colors cursor-pointer"
                              title="Play sound for everyone"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSound(sound.id)}
                                className="p-2 rounded-lg bg-[#252525] hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete sound"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
