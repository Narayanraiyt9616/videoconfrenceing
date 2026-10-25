import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Shield, Check, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const AVATARS = ['👨‍💻', '👩‍💻', '🎓', '👑', '🚀', '🔥', '🧠', '⚡', '🦉', '💼', '💻', '🧪'];

export function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();
  const [tab, setTab] = useState('profile'); // 'profile' | 'security'

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👨‍💻');
  const [department, setDepartment] = useState(user?.department || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [isUpdating, setIsUpdating] = useState(false);

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  if (!isOpen || !user) return null;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateProfile({ name, avatar, department, role });
    setIsUpdating(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setIsChangingPass(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPass(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
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
            <div className="flex items-center gap-2.5">
              <span className="text-3xl p-1 bg-[#282a2d] rounded-xl border border-[#3c4043]">
                {avatar}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">{user.name}</h3>
                <p className="text-xs text-[#9aa0a6] capitalize">{user.role} Account • {user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#303134] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-2 mt-4 pb-2 border-b border-[#303134]">
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'profile'
                  ? 'bg-[#1a73e8] text-white'
                  : 'text-[#9aa0a6] hover:text-white hover:bg-[#282a2d]'
              }`}
            >
              Account Information
            </button>
            <button
              type="button"
              onClick={() => setTab('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'security'
                  ? 'bg-[#1a73e8] text-white'
                  : 'text-[#9aa0a6] hover:text-white hover:bg-[#282a2d]'
              }`}
            >
              Change Password
            </button>
          </div>

          {tab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Department / Organization</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science / Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                />
              </div>

              {/* Role Switcher */}
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['user', 'faculty', 'student'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 px-2 rounded-lg border text-xs capitalize transition-all ${
                        role === r
                          ? 'border-[#8ab4f8] bg-[#1a73e8]/20 text-[#8ab4f8] font-bold'
                          : 'border-[#3c4043] bg-[#282a2d] text-[#9aa0a6]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Change Avatar</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm transition-all ${
                        avatar === a
                          ? 'bg-[#1a73e8] border border-white scale-110 shadow-sm'
                          : 'bg-[#282a2d] border border-[#3c4043] hover:border-[#8ab4f8]'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full mt-3 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bdc1c6] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-[#282a2d] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full mt-3 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isChangingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
