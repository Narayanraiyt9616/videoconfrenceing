import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Video,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../navbar/Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../utils/api.js';
import toast from 'react-hot-toast';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [meetingsList, setMeetingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'meetings'

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/api/admin/stats');
      if (statsRes.success) setStats(statsRes.stats);

      const usersRes = await api.get('/api/admin/users');
      if (usersRes.success) setUsersList(usersRes.users);

      const meetingsRes = await api.get('/api/admin/meetings');
      if (meetingsRes.success) setMeetingsList(meetingsRes.meetings);
    } catch (err) {
      toast.error('Failed to load admin metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}`, { role: newRole });
      if (res.success) {
        toast.success(`User role updated to ${newRole}! ✨`);
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await api.put(`/api/admin/users/${userId}`, { status: nextStatus });
      if (res.success) {
        toast.success(`User marked as ${nextStatus}!`);
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#131314] text-white flex flex-col">
      <Navbar onInstantMeetingStart={() => {}} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#282a2d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                MeetHub Admin Control Center
              </h1>
              <p className="text-xs text-[#9aa0a6]">
                Manage platform users, roles, meetings audit, and system health.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#202124] hover:bg-[#282a2d] border border-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-4 rounded-xl bg-[#202124] border border-[#3c4043]">
              <span className="text-xs text-[#9aa0a6] block">Registered Users</span>
              <span className="text-2xl font-bold text-white mt-1 block">{stats.totalUsers}</span>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">
                {stats.activeUsers} active accounts
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#202124] border border-[#3c4043]">
              <span className="text-xs text-[#9aa0a6] block">Total Meetings</span>
              <span className="text-2xl font-bold text-[#8ab4f8] mt-1 block">
                {stats.totalMeetings}
              </span>
              <span className="text-[10px] text-[#9aa0a6] mt-0.5 block">
                {stats.completedMeetings} completed
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#202124] border border-[#3c4043]">
              <span className="text-xs text-[#9aa0a6] block">Active / Ongoing Rooms</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                {stats.ongoingMeetings}
              </span>
              <span className="text-[10px] text-[#9aa0a6] mt-0.5 block">Live in WebRTC memory</span>
            </div>

            <div className="p-4 rounded-xl bg-[#202124] border border-[#3c4043]">
              <span className="text-xs text-[#9aa0a6] block">Classroom Lectures</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">
                {stats.classroomCount}
              </span>
              <span className="text-[10px] text-[#9aa0a6] mt-0.5 block">
                Faculty: {stats.roles?.faculty || 0} • Students: {stats.roles?.student || 0}
              </span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#202124] border border-[#3c4043]">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'users' ? 'bg-[#1a73e8] text-white shadow-md' : 'text-[#9aa0a6] hover:text-white'
              }`}
            >
              Registered Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'meetings' ? 'bg-[#1a73e8] text-white shadow-md' : 'text-[#9aa0a6] hover:text-white'
              }`}
            >
              Platform Meetings ({meetingsList.length})
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#202124] border border-[#3c4043] focus:border-[#8ab4f8] focus:outline-none text-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === 'users' ? (
          <div className="rounded-xl border border-[#3c4043] bg-[#202124] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#282a2d] text-[#bdc1c6] border-b border-[#3c4043] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282a2d]">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-[#282a2d]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span className="text-lg">{u.avatar || '👨‍💻'}</span>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-4 text-[#bdc1c6]">{u.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-[#141517] border border-[#3c4043] text-xs font-semibold capitalize text-[#8ab4f8] focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="faculty">Faculty</option>
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-[#9aa0a6]">{u.department || 'General'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status !== 'disabled'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {u.status !== 'disabled' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u._id, u.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.status !== 'disabled'
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {u.status !== 'disabled' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab 2: Meetings Table */
          <div className="rounded-xl border border-[#3c4043] bg-[#202124] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#282a2d] text-[#bdc1c6] border-b border-[#3c4043] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Host</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282a2d]">
                  {meetingsList.map((m) => (
                    <tr key={m._id} className="hover:bg-[#282a2d]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#8ab4f8]">
                        {m.meetingCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{m.title}</td>
                      <td className="py-3 px-4 text-[#bdc1c6]">{m.hostName}</td>
                      <td className="py-3 px-4">
                        {m.isClassroom ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            Classroom {m.courseCode ? `(${m.courseCode})` : ''}
                          </span>
                        ) : (
                          <span className="text-[#9aa0a6]">General Meeting</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.status === 'scheduled'
                              ? 'bg-amber-500/20 text-amber-300'
                              : m.status === 'ongoing'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#9aa0a6]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
