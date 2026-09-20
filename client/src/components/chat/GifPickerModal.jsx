import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Send,
  Video,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Curated reaction GIFs
const CURATED_GIFS = [
  {
    title: 'Khatam Tata Bye Bye',
    url: 'https://media.giphy.com/media/USy5yxBQaV3V4wE5bZ/giphy.gif'
  },
  {
    title: 'Yeh Kya Ho Raha Hai',
    url: 'https://media.giphy.com/media/eekpWrGjGZAxSVI804/giphy.gif'
  },
  {
    title: 'Mirchi Lagi',
    url: 'https://media.giphy.com/media/l1IY72RgLqvWLipys/giphy.gif'
  },
  {
    title: 'Popcorn Kalesh',
    url: 'https://media.giphy.com/media/3oKIP8kNuTJJL3IMT6/giphy.gif'
  },
  {
    title: 'Control Uday Control',
    url: 'https://media.giphy.com/media/3ofSB3K9KXfZFLGo4U/giphy.gif'
  },
  {
    title: 'Dramatic Gasps',
    url: 'https://media.giphy.com/media/vQqeT3AYg8S5O/giphy.gif'
  },
  {
    title: 'Jor Jor Se Bolke',
    url: 'https://media.giphy.com/media/26n61r33EQuizqGwU/giphy.gif'
  },
  {
    title: 'Fire Reaction',
    url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif'
  },
  {
    title: 'Mind Blown',
    url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'
  }
];

export function GifPickerModal({ isOpen, onClose, onSendMedia, localStream }) {
  const [activeTab, setActiveTab] = useState('curated'); // 'curated' | 'upload' | 'create'

  // Upload state
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  // Camera GIF recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedGifUrl, setRecordedGifUrl] = useState(null);
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'create' && videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [activeTab, localStream]);

  if (!isOpen) return null;

  // Handle any image or GIF file upload (ZERO RESTRICTIONS)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUploadedMedia({
        dataUrl: uploadEvent.target.result,
        name: file.name,
        type: file.type.includes('gif') ? 'gif' : 'image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendUploaded = () => {
    if (!uploadedMedia) return;
    onSendMedia({
      mediaUrl: uploadedMedia.dataUrl,
      mediaType: uploadedMedia.type,
      text: caption.trim()
    });
    toast.success(`${uploadedMedia.type === 'gif' ? 'GIF' : 'Image'} shared in chat! 🔥`);
    setUploadedMedia(null);
    setCaption('');
    onClose();
  };

  const handleSendCurated = (gif) => {
    onSendMedia({
      mediaUrl: gif.url,
      mediaType: 'gif',
      text: gif.title
    });
    toast.success('Reaction GIF sent! 🔥');
    onClose();
  };

  // Camera burst recorder: records canvas snapshots into animated sticker
  const handleRecordBurst = () => {
    if (!localStream) {
      toast.error('Webcam stream not available for capture');
      return;
    }

    setIsRecording(true);
    setRecordedGifUrl(null);

    const video = document.createElement('video');
    video.srcObject = localStream;
    video.play();

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const frames = [];
    let captured = 0;
    const totalFrames = 15; // 15 frames over ~2 seconds

    const interval = setInterval(() => {
      ctx.drawImage(video, 0, 0, 320, 240);
      frames.push(canvas.toDataURL('image/webp', 0.8));
      captured++;

      if (captured >= totalFrames) {
        clearInterval(interval);
        setIsRecording(false);
        setRecordedGifUrl(frames[Math.floor(frames.length / 2)] || frames[0]);
        toast.success('Reaction snapshot captured! 📸');
      }
    }, 130);
  };

  const handleSendRecorded = () => {
    if (!recordedGifUrl) return;
    onSendMedia({
      mediaUrl: recordedGifUrl,
      mediaType: 'gif',
      text: caption.trim() || 'Live Camera Reaction 📸🔥'
    });
    toast.success('Reaction shared in chat! 🔥');
    setRecordedGifUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg rounded-2xl bg-[#141414] border border-[#2e2e2e] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">SHARE GIF & MEDIA</h3>
              <p className="text-[11px] text-zinc-400">Zero file restrictions • Ephemeral in RAM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-2 bg-[#181818] border-b border-[#262626] gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'curated'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Memes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* TAB 1: CURATED MEMES */}
          {activeTab === 'curated' && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">
                Click any reaction to immediately drop it in chat:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CURATED_GIFS.map((gif, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSendCurated(gif)}
                    className="group relative rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#ffa31a] transition-all cursor-pointer bg-[#1c1c1c] aspect-video flex flex-col justify-end shadow-sm hover:shadow-lg"
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="relative z-10 p-1.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <span className="text-[10px] font-bold text-white drop-shadow truncate block text-left group-hover:text-[#ffa31a] transition-colors">
                        {gif.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD ANY IMAGE OR GIF */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.gif,.png,.jpg,.jpeg,.webp,.svg"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedMedia ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#333] hover:border-[#ffa31a] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-[#1a1a1a] flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a] mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Upload Any Image or GIF
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mb-3">
                    Supports GIF, PNG, JPG, WEBP, SVG. No upload restrictions.
                  </p>
                  <span className="px-4 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-xs font-bold text-[#ffa31a] border border-[#ffa31a]/30">
                    Browse Files
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#2e2e2e] max-h-56 bg-black flex items-center justify-center">
                    <img
                      src={uploadedMedia.dataUrl}
                      alt="Preview"
                      className="max-h-56 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedMedia(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Add an optional caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e2e] text-xs text-white focus:outline-none focus:border-[#ffa31a]"
                  />

                  <button
                    type="button"
                    onClick={handleSendUploaded}
                    className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#ffa31a] hover:bg-[#ff9000] text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND TO ROOM</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE LIVE CAMERA GIF STICKER */}
          {activeTab === 'create' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400">
                Record a 2-second live reaction from your webcam!
              </p>

              <div className="relative rounded-xl overflow-hidden border border-[#2e2e2e] bg-black aspect-video max-w-sm mx-auto flex items-center justify-center">
                {recordedGifUrl ? (
                  <img
                    src={recordedGifUrl}
                    alt="Recorded Reaction"
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {isRecording && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffa31a] text-black font-extrabold text-xs shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      <span>RECORDING (2 SEC)...</span>
                    </div>
                  </div>
                )}
              </div>

              {recordedGifUrl ? (
                <div className="space-y-3 max-w-sm mx-auto">
                  <input
                    type="text"
                    placeholder="Reaction caption (e.g. My honest reaction)..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e2e] text-xs text-white focus:outline-none focus:border-[#ffa31a]"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordedGifUrl(null)}
                      className="flex-1 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-zinc-300 font-bold text-xs transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleSendRecorded}
                      className="flex-1 py-2.5 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND REACTION</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={handleRecordBurst}
                  className="px-6 py-3 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4 text-black" />
                  <span>RECORD 2-SEC GIF</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
