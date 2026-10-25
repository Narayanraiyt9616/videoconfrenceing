import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PenTool,
  Eraser,
  RotateCcw,
  Download,
  Palette,
  Minus,
  Plus,
  Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#0F172A', // Slate / Black
  '#1E3A8A', // Academic Blue
  '#2563EB', // Royal Blue
  '#0D9488', // Teal
  '#DC2626', // Red
  '#16A34A', // Green
  '#F59E0B'  // Amber
];

export function EducationalWhiteboardModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1E3A8A');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to let the modal animate and canvas mount with correct layout sizes
    const timeout = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      // Set resolution based on bounding box
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, 150);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    toast.success('Whiteboard cleared');
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `campusverse-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Whiteboard snapshot saved! 📥');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">Interactive Classroom Whiteboard</h3>
                <p className="text-[11px] text-[#64748B]">Draw formulas, sketch diagrams, and annotate lessons live</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              {/* Color Presets */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-[#CBD5E1]">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      setTool('pen');
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      color === c && tool === 'pen' ? 'scale-125 ring-2 ring-offset-1 ring-[#1E3A8A]' : 'hover:scale-110'
                    }`}
                    title={c}
                  />
                ))}
              </div>

              {/* Tool selector */}
              <div className="flex items-center gap-1 bg-white border border-[#CBD5E1] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTool('pen')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    tool === 'pen'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('eraser')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    tool === 'eraser'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>
              </div>

              {/* Stroke Size */}
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] text-xs font-bold text-[#0F172A]">
                <button
                  type="button"
                  onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                  className="p-1 hover:bg-slate-100 rounded text-[#64748B]"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center">{brushSize}px</span>
                <button
                  type="button"
                  onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
                  className="p-1 hover:bg-slate-100 rounded text-[#64748B]"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Clear Canvas */}
              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-100 text-[#DC2626] text-xs font-bold transition-colors cursor-pointer"
                title="Clear Whiteboard"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Download PNG */}
              <button
                type="button"
                onClick={downloadWhiteboard}
                className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-100 text-[#0D9488] text-xs font-bold transition-colors cursor-pointer"
                title="Download Drawing"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 w-full h-full bg-white relative cursor-crosshair overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full block touch-none"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
