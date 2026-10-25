import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';
import { User } from '../models/User.js';
import { Meeting } from '../models/Meeting.js';
import { Attendance } from '../models/Attendance.js';
import { Recording } from '../models/Recording.js';
import { Message } from '../models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

class Store {
  constructor() {
    this.memoryData = {
      users: [],
      meetings: [],
      attendance: [],
      recordings: [],
      messages: []
    };
    this.loadFromFile();
    this.seedDefaults();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.memoryData = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[Store] Could not load store.json, initializing fresh store:', err.message);
    }
  }

  saveToFile() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Store] Failed to write store.json:', err.message);
    }
  }

  async seedDefaults() {
    // Check if admin exists in memory store
    const hasAdmin = this.memoryData.users.some((u) => u.email === 'admin@meethub.com');
    if (!hasAdmin) {
      const hashedAdmin = await bcrypt.hash('admin123', 10);
      const hashedProf = await bcrypt.hash('prof123', 10);
      const hashedStudent = await bcrypt.hash('student123', 10);

      this.memoryData.users.push(
        {
          _id: 'usr_admin_001',
          name: 'Administrator',
          email: 'admin@meethub.com',
          password: hashedAdmin,
          role: 'admin',
          avatar: '👑',
          department: 'Platform Operations',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'usr_prof_002',
          name: 'Prof. Ramesh Sharma',
          email: 'prof.sharma@meethub.com',
          password: hashedProf,
          role: 'faculty',
          avatar: '🎓',
          department: 'Computer Science & AI',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'usr_student_003',
          name: 'Aarav Patel',
          email: 'student@meethub.com',
          password: hashedStudent,
          role: 'student',
          avatar: '🚀',
          department: 'B.Tech IT',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      );

      // Seed scheduled meetings
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      this.memoryData.meetings.push(
        {
          _id: 'mtg_001',
          meetingCode: 'CS101-LAB',
          title: 'CS101: Distributed Systems & WebRTC Architecture',
          description: 'Live interactive class covering signaling protocols, STUN/TURN, and peer mesh topologies.',
          hostId: 'usr_prof_002',
          hostName: 'Prof. Ramesh Sharma',
          hostEmail: 'prof.sharma@meethub.com',
          status: 'scheduled',
          scheduledStartTime: inOneHour.toISOString(),
          durationMinutes: 90,
          passcode: '',
          isClassroom: true,
          courseCode: 'CS101',
          settings: {
            allowJoinerChat: true,
            allowJoinerScreenShare: false,
            allowJoinerUnmute: true,
            isLocked: false,
            waitingRoomEnabled: true
          },
          participantsHistory: [],
          createdAt: now.toISOString()
        },
        {
          _id: 'mtg_002',
          meetingCode: 'HUB-SYNC',
          title: 'Daily Engineering Standup & Sprint Sync',
          description: 'Daily team review of video conferencing features, bug triage, and deployment check.',
          hostId: 'usr_admin_001',
          hostName: 'Administrator',
          hostEmail: 'admin@meethub.com',
          status: 'scheduled',
          scheduledStartTime: tomorrow.toISOString(),
          durationMinutes: 45,
          passcode: '',
          isClassroom: false,
          courseCode: '',
          settings: {
            allowJoinerChat: true,
            allowJoinerScreenShare: true,
            allowJoinerUnmute: true,
            isLocked: false,
            waitingRoomEnabled: false
          },
          participantsHistory: [],
          createdAt: now.toISOString()
        }
      );

      this.saveToFile();
    }
  }

  // ================= USERS =================
  async findUserByEmail(email, includePassword = false) {
    const cleanEmail = email.toLowerCase().trim();
    if (isDbConnected()) {
      const q = User.findOne({ email: cleanEmail });
      if (includePassword) q.select('+password');
      return await q.exec();
    }
    const user = this.memoryData.users.find((u) => u.email === cleanEmail);
    if (!user) return null;
    const clone = { ...user };
    if (!includePassword) delete clone.password;
    return clone;
  }

  async findUserById(id) {
    if (isDbConnected()) {
      return await User.findById(id).select('-password').exec();
    }
    const user = this.memoryData.users.find((u) => u._id === String(id) || u.id === String(id));
    if (!user) return null;
    const clone = { ...user };
    delete clone.password;
    return clone;
  }

  async createUser({ name, email, password, role = 'user', avatar = '👨‍💻', department = '' }) {
    const cleanEmail = email.toLowerCase().trim();
    if (isDbConnected()) {
      const user = new User({
        name,
        email: cleanEmail,
        password,
        role,
        avatar,
        department
      });
      return await user.save();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      avatar,
      department,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.memoryData.users.push(newUser);
    this.saveToFile();
    const returnUser = { ...newUser };
    delete returnUser.password;
    return returnUser;
  }

  async updateUser(id, updates) {
    if (isDbConnected()) {
      return await User.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).select('-password').exec();
    }
    const idx = this.memoryData.users.findIndex((u) => u._id === String(id) || u.id === String(id));
    if (idx === -1) return null;
    this.memoryData.users[idx] = { ...this.memoryData.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToFile();
    const clone = { ...this.memoryData.users[idx] };
    delete clone.password;
    return clone;
  }

  async getAllUsers() {
    if (isDbConnected()) {
      return await User.find({}).select('-password').sort({ createdAt: -1 }).exec();
    }
    return this.memoryData.users.map((u) => {
      const clone = { ...u };
      delete clone.password;
      return clone;
    });
  }

  // ================= MEETINGS =================
  async findMeetingByCode(code) {
    const cleanCode = String(code).toUpperCase().trim();
    if (isDbConnected()) {
      return await Meeting.findOne({ meetingCode: cleanCode }).exec();
    }
    return this.memoryData.meetings.find((m) => m.meetingCode === cleanCode) || null;
  }

  async createMeeting(meetingData) {
    const cleanCode = meetingData.meetingCode.toUpperCase().trim();
    if (isDbConnected()) {
      const m = new Meeting({ ...meetingData, meetingCode: cleanCode });
      return await m.save();
    }

    const newMeeting = {
      _id: `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      meetingCode: cleanCode,
      title: meetingData.title || 'MeetHub Video Conference',
      description: meetingData.description || '',
      hostId: meetingData.hostId || null,
      hostName: meetingData.hostName || 'Host',
      hostEmail: meetingData.hostEmail || '',
      status: meetingData.status || 'ongoing',
      scheduledStartTime: meetingData.scheduledStartTime || new Date().toISOString(),
      durationMinutes: meetingData.durationMinutes || 60,
      passcode: meetingData.passcode || '',
      isClassroom: Boolean(meetingData.isClassroom),
      courseCode: meetingData.courseCode || '',
      settings: meetingData.settings || {
        allowJoinerChat: true,
        allowJoinerScreenShare: true,
        allowJoinerUnmute: true,
        isLocked: false,
        waitingRoomEnabled: false
      },
      participantsHistory: meetingData.participantsHistory || [],
      createdAt: new Date().toISOString()
    };

    this.memoryData.meetings.unshift(newMeeting);
    this.saveToFile();
    return newMeeting;
  }

  async updateMeeting(code, updates) {
    const cleanCode = String(code).toUpperCase().trim();
    if (isDbConnected()) {
      return await Meeting.findOneAndUpdate({ meetingCode: cleanCode }, updates, { returnDocument: 'after' }).exec();
    }
    const idx = this.memoryData.meetings.findIndex((m) => m.meetingCode === cleanCode);
    if (idx === -1) return null;
    this.memoryData.meetings[idx] = { ...this.memoryData.meetings[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToFile();
    return this.memoryData.meetings[idx];
  }

  async getUserMeetings(userId, userEmail) {
    if (isDbConnected()) {
      return await Meeting.find({
        $or: [{ hostId: userId }, { hostEmail: userEmail }]
      })
        .sort({ scheduledStartTime: -1, createdAt: -1 })
        .exec();
    }
    return this.memoryData.meetings
      .filter((m) => m.hostId === String(userId) || (userEmail && m.hostEmail === userEmail))
      .sort((a, b) => new Date(b.scheduledStartTime || b.createdAt) - new Date(a.scheduledStartTime || a.createdAt));
  }

  async getAllMeetings() {
    if (isDbConnected()) {
      return await Meeting.find({}).sort({ createdAt: -1 }).exec();
    }
    return [...this.memoryData.meetings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // ================= ATTENDANCE =================
  async recordAttendance({ meetingId, meetingCode, courseCode, participantName, participantEmail, role = 'student' }) {
    const record = {
      _id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      meetingId: meetingId || null,
      meetingCode: String(meetingCode).toUpperCase().trim(),
      courseCode: courseCode || '',
      participantName: participantName.trim(),
      participantEmail: participantEmail ? participantEmail.toLowerCase().trim() : '',
      role,
      joinedAt: new Date().toISOString(),
      leftAt: null,
      durationMinutes: 0,
      status: 'Present',
      createdAt: new Date().toISOString()
    };

    if (isDbConnected()) {
      const att = new Attendance(record);
      return await att.save();
    }

    this.memoryData.attendance.push(record);
    this.saveToFile();
    return record;
  }

  async markAttendanceLeave(meetingCode, participantName) {
    const cleanCode = String(meetingCode).toUpperCase().trim();
    const now = new Date();

    if (isDbConnected()) {
      const att = await Attendance.findOne({
        meetingCode: cleanCode,
        participantName,
        leftAt: null
      }).sort({ joinedAt: -1 });

      if (att) {
        att.leftAt = now;
        const diffMs = now.getTime() - new Date(att.joinedAt).getTime();
        att.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        return await att.save();
      }
      return null;
    }

    const record = [...this.memoryData.attendance]
      .reverse()
      .find((a) => a.meetingCode === cleanCode && a.participantName === participantName && !a.leftAt);

    if (record) {
      record.leftAt = now.toISOString();
      const diffMs = now.getTime() - new Date(record.joinedAt).getTime();
      record.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
      this.saveToFile();
      return record;
    }
    return null;
  }

  async getMeetingAttendance(meetingCode) {
    const cleanCode = String(meetingCode).toUpperCase().trim();
    if (isDbConnected()) {
      return await Attendance.find({ meetingCode: cleanCode }).sort({ joinedAt: 1 }).exec();
    }
    return this.memoryData.attendance.filter((a) => a.meetingCode === cleanCode);
  }

  // ================= RECORDINGS =================
  async saveRecording({ meetingCode, title, hostId, hostName, durationSeconds, fileSize, fileUrl }) {
    const cleanCode = String(meetingCode).toUpperCase().trim();
    const rec = {
      _id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      meetingCode: cleanCode,
      title: title || `Recording ${cleanCode}`,
      hostId: hostId || null,
      hostName: hostName || 'Host',
      durationSeconds: durationSeconds || 0,
      fileSize: fileSize || 0,
      fileUrl: fileUrl || '',
      recordedAt: new Date().toISOString()
    };

    if (isDbConnected()) {
      const doc = new Recording(rec);
      return await doc.save();
    }

    this.memoryData.recordings.unshift(rec);
    this.saveToFile();
    return rec;
  }

  async getRecordings(hostId) {
    if (isDbConnected()) {
      const filter = hostId ? { hostId } : {};
      return await Recording.find(filter).sort({ recordedAt: -1 }).exec();
    }
    if (hostId) {
      return this.memoryData.recordings.filter((r) => r.hostId === String(hostId));
    }
    return this.memoryData.recordings;
  }
}

export const dbStore = new Store();
export default dbStore;
