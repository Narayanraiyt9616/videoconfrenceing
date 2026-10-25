import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Plus,
  Share2,
  Calendar,
  User,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_MATERIALS = [
  {
    id: 'mat_1',
    title: 'Lecture Slides - Computer Networks & Distributed Systems',
    subject: 'CS402: Advanced Distributed Systems',
    sharedBy: 'Prof. Sharma (Faculty)',
    date: 'Today, 10:15 AM',
    type: 'PDF Slides',
    size: '4.8 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'mat_2',
    title: 'Tutorial Problem Set 4: Protocol Architectures',
    subject: 'CS402: Advanced Distributed Systems',
    sharedBy: 'Dr. Anita Roy',
    date: 'Yesterday',
    type: 'Problem Set',
    size: '1.2 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'mat_3',
    title: 'Reference Architecture & RFC Specifications Handout',
    subject: 'CS402: Advanced Distributed Systems',
    sharedBy: 'Prof. Sharma (Faculty)',
    date: 'Oct 24, 2026',
    type: 'Reference Guide',
    size: '2.5 MB',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

export function StudyMaterialsDrawer({ isOpen, onClose, isHost }) {
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen) return null;

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem = {
      id: 'mat_' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General Coursework',
      sharedBy: isHost ? 'Faculty Host (You)' : 'Student Contributor',
      date: 'Just now',
      type: 'Shared Document',
      size: 'Web Resource',
      url: newUrl.trim() || '#'
    };

    setMaterials([newItem, ...materials]);
    setNewTitle('');
    setNewSubject('');
    setNewUrl('');
    setShowAddModal(false);
    toast.success('Study material shared with classroom! 📚');
  };

  const handleDownload = (mat) => {
    window.open(mat.url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${mat.title}`);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50 flex flex-col bg-white border-l border-[#E2E8F0] shadow-2xl font-sans"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0F172A]">Study Materials</h3>
            <p className="text-[11px] text-[#64748B]">Classroom Notes, Slides & Handouts</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Faculty Add Material Action */}
      {isHost && (
        <div className="p-3 border-b border-[#E2E8F0] bg-blue-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1E3A8A]">Faculty Resource Center</span>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E3A8A] hover:bg-[#172554] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Share Resource</span>
          </button>
        </div>
      )}

      {/* Materials List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {materials.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
            <FolderOpen className="w-12 h-12 text-[#CBD5E1] mb-2" />
            <p className="text-sm font-bold text-[#0F172A]">No Study Materials Shared</p>
            <p className="text-xs text-[#64748B] mt-1">
              Your faculty member has not posted materials for this lecture yet.
            </p>
          </div>
        ) : (
          materials.map((mat) => (
            <div
              key={mat.id}
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-white transition-all space-y-2 group shadow-2xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#0F172A] leading-snug group-hover:text-[#1E3A8A] transition-colors">
                    {mat.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                    {mat.subject}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0]/70">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[#0D9488]" />
                  {mat.sharedBy}
                </span>
                <span className="font-semibold text-[#0D9488] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/50">
                  {mat.type}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownload(mat)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Download / View</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#CBD5E1] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#0F172A]">Share New Study Material</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Document / Slide Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Lecture Notes"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Subject or Module
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. CS402: Distributed Systems"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Resource URL / Link
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or PDF link"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold shadow-xs hover:bg-[#172554]"
                >
                  Share With Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
