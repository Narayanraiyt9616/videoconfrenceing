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
  Zap,
  Play,
  Pause,
  AlertTriangle,
  Film
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
  const [activeTab, setActiveTab] = useState('curated'); // 'curated' | 'upload' | 'record'

  // Upload state
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [durationError, setDurationError] = useState('');
  const fileInputRef = useRef(null);

  // Video preview player state
  const [isPlaying, setIsPlaying] = useState(false);
  const previewVideoRef = useRef(null);

  // Live camera 5s video recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const liveVideoPreviewRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'record' && liveVideoPreviewRef.current && localStream) {
      liveVideoPreviewRef.current.srcObject = localStream;
    }
  }, [activeTab, localStream]);

  if (!isOpen) return null;

  // Handle file upload with duration validation for videos (≤ 5 seconds)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDurationError('');

    const isVideo = file.type.startsWith('video/');
    const isGif = file.type.includes('gif');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isGif && !isImage) {
      toast.error('Unsupported file format! Please choose an image, GIF, or MP4/WebM video.');
      return;
    }

    // If it's a video, check duration first
    if (isVideo) {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = URL.createObjectURL(file);

      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(tempVideo.src);
        const duration = tempVideo.duration;

        if (duration > 5.5) {
          const err = `Video exceeds 5 seconds limit! (${duration.toFixed(1)}s). Please trim or select a clip under 5 seconds.`;
          setDurationError(err);
          toast.error(err, { duration: 5000 });
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Duration is valid (≤ 5s)
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setUploadedMedia({
            dataUrl: uploadEvent.target.result,
            name: file.name,
            type: 'video',
            duration: Math.round(duration)
          });
          toast.success(`5s Video clip loaded! Ready to share.`);
        };
        reader.readAsDataURL(file);
      };

      tempVideo.onerror = () => {
        toast.error('Could not read video metadata. Please try an MP4 or WebM file.');
      };
      return;
    }

    // For Image or GIF
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUploadedMedia({
        dataUrl: uploadEvent.target.result,
        name: file.name,
        type: isGif ? 'gif' : 'image'
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
    toast.success(`${uploadedMedia.type.toUpperCase()} shared in chat! 🔥`);
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

  // Start 5-second video recording from webcam
  const start5sRecording = () => {
    if (!localStream) {
      toast.error('Webcam stream not available for recording');
      return;
    }

    recordedChunksRef.current = [];
    setIsRecording(true);
    setCountdown(5);
    setRecordedVideoUrl(null);

    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }

    try {
      const recorder = new MediaRecorder(localStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedVideoUrl(reader.result);
          setIsRecording(false);
          toast.success('5-second video recorded! 🎥');
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();

      // Countdown interval
      let timeLeft = 5;
      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timer);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      setIsRecording(false);
      toast.error('Could not record video: ' + err.message);
    }
  };

  const handleSendRecordedVideo = () => {
    if (!recordedVideoUrl) return;
    onSendMedia({
      mediaUrl: recordedVideoUrl,
      mediaType: 'video',
      text: caption.trim() || '5s Camera Reaction 🎥🔥'
    });
    toast.success('Short video shared in chat! 🔥');
    setRecordedVideoUrl(null);
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
              <h3 className="text-base font-extrabold text-white">SHARE GIF, MEME & VIDEO</h3>
              <p className="text-[11px] text-zinc-400">Up to 5-sec clips • Ephemeral in RAM</p>
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
            <span>Upload Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'record'
                ? 'bg-[#ffa31a] text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#202020]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Record 5s Video</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* TAB 1: CURATED MEMES */}
          {activeTab === 'curated' && (
            <div>
              <p className="text-xs text-zinc-400 mb-3">
                Click any reaction to immediately send it to the room:
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

          {/* TAB 2: UPLOAD IMAGE, GIF, OR 5-SECOND VIDEO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.gif,.png,.jpg,.jpeg,.webp,video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedMedia ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#333] hover:border-[#ffa31a] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-[#1a1a1a] flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#ffa31a]/15 border border-[#ffa31a]/30 flex items-center justify-center text-[#ffa31a] mb-3">
                    <Film className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Upload Photo, GIF, or Short Video
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mb-2 leading-relaxed">
                    Upload GIF, PNG, JPG, or a short video clip up to <strong>5 seconds</strong> (MP4 / WebM).
                  </p>
                  <span className="px-4 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-xs font-bold text-[#ffa31a] border border-[#ffa31a]/30">
                    Browse Files
                  </span>

                  {durationError && (
                    <div className="mt-4 p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{durationError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#2e2e2e] max-h-60 bg-black flex items-center justify-center">
                    {uploadedMedia.type === 'video' ? (
                      <div className="relative w-full aspect-video flex items-center justify-center bg-black">
                        <video
                          ref={previewVideoRef}
                          src={uploadedMedia.dataUrl}
                          controls
                          autoPlay
                          loop
                          className="max-h-56 w-auto object-contain"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                          VIDEO ({uploadedMedia.duration}s)
                        </span>
                      </div>
                    ) : (
                      <img
                        src={uploadedMedia.dataUrl}
                        alt="Preview"
                        className="max-h-56 w-auto object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedMedia(null);
                        setDurationError('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remove media"
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
                    <span>SHARE {uploadedMedia.type.toUpperCase()} WITH ROOM</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECORD 5-SECOND LIVE VIDEO */}
          {activeTab === 'record' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400">
                Record a quick 5-second video reaction directly with your camera!
              </p>

              <div className="relative rounded-2xl overflow-hidden border border-[#2e2e2e] bg-black aspect-video max-w-sm mx-auto flex items-center justify-center shadow-lg">
                {recordedVideoUrl ? (
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <video
                    ref={liveVideoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {isRecording && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 rounded-full border-4 border-[#ffa31a] flex items-center justify-center text-2xl font-black text-[#ffa31a] animate-pulse">
                      {countdown}s
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>RECORDING VIDEO...</span>
                    </div>
                  </div>
                )}
              </div>

              {recordedVideoUrl ? (
                <div className="space-y-3 max-w-sm mx-auto">
                  <input
                    type="text"
                    placeholder="Add caption for video reaction..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e2e] text-xs text-white focus:outline-none focus:border-[#ffa31a]"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordedVideoUrl(null)}
                      className="flex-1 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleSendRecordedVideo}
                      className="flex-1 py-2.5 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND VIDEO</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={start5sRecording}
                  className="px-6 py-3.5 rounded-xl bg-[#ffa31a] hover:bg-[#ff9000] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-[#ffa31a]/25 transition-all disabled:opacity-50"
                >
                  <Video className="w-4 h-4 text-black" />
                  <span>START 5-SECOND RECORDING</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
