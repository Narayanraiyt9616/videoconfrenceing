import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Video, Volume2, Settings, ShieldCheck, Play } from 'lucide-react';
import { soundFx } from '../../utils/soundFx.js';
import toast from 'react-hot-toast';

export function DeviceSettingsModal({ isOpen, onClose, onDeviceChange }) {
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);

  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');

  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const testStreamRef = useRef(null);

  // Enumerate connected devices
  useEffect(() => {
    if (!isOpen) return;

    async function getDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioIns = devices.filter((d) => d.kind === 'audioinput');
        const videoIns = devices.filter((d) => d.kind === 'videoinput');
        const audioOuts = devices.filter((d) => d.kind === 'audiooutput');

        setAudioInputDevices(audioIns);
        setVideoInputDevices(videoIns);
        setAudioOutputDevices(audioOuts);

        if (audioIns[0] && !selectedAudioInput) setSelectedAudioInput(audioIns[0].deviceId);
        if (videoIns[0] && !selectedVideoInput) setSelectedVideoInput(videoIns[0].deviceId);
        if (audioOuts[0] && !selectedAudioOutput) setSelectedAudioOutput(audioOuts[0].deviceId);
      } catch (err) {
        console.warn('[DeviceSettings] enumerateDevices error:', err);
      }
    }

    getDevices();
  }, [isOpen]);

  // Mic level test visualizer
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    async function startMicMeter() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
          video: false
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        testStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!isSubscribed) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        // Fallback or permission blocked
      }
    }

    startMicMeter();

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, selectedAudioInput]);

  if (!isOpen) return null;

  const handleTestSpeaker = () => {
    soundFx.playJoin();
    toast.success('Speaker test tone played! 🔊');
  };

  const handleSave = () => {
    if (onDeviceChange) {
      onDeviceChange({
        audioInputId: selectedAudioInput,
        videoInputId: selectedVideoInput,
        audioOutputId: selectedAudioOutput,
        noiseSuppression,
        echoCancellation
      });
    }
    toast.success('Audio & Video settings applied! ✨');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-6 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Audio & Video Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#303134] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Microphone Selection */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#bdc1c6] mb-1.5">
                <Mic className="w-4 h-4 text-[#8ab4f8]" />
                <span>Microphone</span>
              </div>
              <select
                value={selectedAudioInput}
                onChange={(e) => setSelectedAudioInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs truncate"
              >
                {audioInputDevices.length === 0 ? (
                  <option value="">Default Microphone</option>
                ) : (
                  audioInputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))
                )}
              </select>

              {/* Mic volume bar visualizer */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-[#9aa0a6] w-12">Input level:</span>
                <div className="flex-1 h-2 rounded-full bg-[#141517] overflow-hidden border border-[#3c4043]">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Camera Selection */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#bdc1c6] mb-1.5">
                <Video className="w-4 h-4 text-[#8ab4f8]" />
                <span>Camera</span>
              </div>
              <select
                value={selectedVideoInput}
                onChange={(e) => setSelectedVideoInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs truncate"
              >
                {videoInputDevices.length === 0 ? (
                  <option value="">Default Web Camera</option>
                ) : (
                  videoInputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speaker Selection & Test */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#bdc1c6]">
                  <Volume2 className="w-4 h-4 text-[#8ab4f8]" />
                  <span>Speakers</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestSpeaker}
                  className="text-xs text-[#8ab4f8] hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Speaker</span>
                </button>
              </div>

              <select
                value={selectedAudioOutput}
                onChange={(e) => setSelectedAudioOutput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs truncate"
              >
                {audioOutputDevices.length === 0 ? (
                  <option value="">Default System Speaker</option>
                ) : (
                  audioOutputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Speaker ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Audio Processing Toggles */}
            <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#bdc1c6]">AI Noise Suppression</span>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1a73e8] bg-[#141517] border-[#5f6368]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#bdc1c6]">Acoustic Echo Cancellation</span>
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => setEchoCancellation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1a73e8] bg-[#141517] border-[#5f6368]"
                />
              </label>
            </div>

            {/* Apply button */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
