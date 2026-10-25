import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

let isConnected = false;

// Attach connection listeners to mongoose connection
mongoose.connection.on('connected', () => {
  isConnected = true;
});
mongoose.connection.on('disconnected', () => {
  isConnected = false;
});
mongoose.connection.on('error', () => {
  isConnected = false;
});

async function migrateStoreToMongo() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    const db = mongoose.connection.db;
    if (!db) return;

    // 1. Migrate Users
    if (Array.isArray(data.users) && data.users.length > 0) {
      const usersCol = db.collection('users');
      for (const u of data.users) {
        if (!u.email) continue;
        const cleanEmail = u.email.toLowerCase().trim();
        const existing = await usersCol.findOne({ email: cleanEmail });
        if (!existing) {
          await usersCol.insertOne({
            name: u.name,
            email: cleanEmail,
            password: u.password, // Preserve already-hashed bcrypt string
            role: u.role || 'user',
            avatar: u.avatar || '👨‍💻',
            department: u.department || '',
            status: u.status || 'active',
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 2. Migrate Meetings
    if (Array.isArray(data.meetings) && data.meetings.length > 0) {
      const meetingsCol = db.collection('meetings');
      for (const m of data.meetings) {
        if (!m.meetingCode) continue;
        const code = m.meetingCode.toUpperCase().trim();
        const existing = await meetingsCol.findOne({ meetingCode: code });
        if (!existing) {
          await meetingsCol.insertOne({
            meetingCode: code,
            title: m.title || 'MeetHub Meeting',
            description: m.description || '',
            hostName: m.hostName || 'Host',
            hostEmail: m.hostEmail || '',
            status: m.status || 'scheduled',
            scheduledStartTime: m.scheduledStartTime ? new Date(m.scheduledStartTime) : new Date(),
            durationMinutes: m.durationMinutes || 60,
            passcode: m.passcode || '',
            isClassroom: Boolean(m.isClassroom),
            courseCode: m.courseCode || '',
            settings: m.settings || {},
            participantsHistory: m.participantsHistory || [],
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 3. Migrate Recordings
    if (Array.isArray(data.recordings) && data.recordings.length > 0) {
      const recCol = db.collection('recordings');
      for (const r of data.recordings) {
        if (!r.meetingCode) continue;
        const existing = await recCol.findOne({ meetingCode: r.meetingCode });
        if (!existing) {
          await recCol.insertOne({
            meetingCode: r.meetingCode,
            title: r.title || 'Recorded Meeting',
            fileUrl: r.fileUrl || '',
            durationSeconds: r.durationSeconds || 0,
            sizeBytes: r.sizeBytes || 0,
            hostName: r.hostName || 'Host',
            recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date()
          });
        }
      }
    }

    console.log('✨ [Migration] Local store data verified and synced to MongoDB Atlas.');
  } catch (err) {
    console.warn('[Migration] Note during store migration:', err.message);
  }
}

export async function connectDB(retries = 3, delayMs = 2000) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meethub';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: 'meethub',
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });

      isConnected = true;
      console.log(`\n📦 [MongoDB] Connected to host: ${conn.connection.host}`);
      console.log(`📦 [MongoDB] Database: ${conn.connection.name}\n`);

      // Safely sync local persistence data to MongoDB Atlas
      await migrateStoreToMongo();

      return true;
    } catch (err) {
      isConnected = false;
      console.error(`\n❌ [MongoDB Connection Attempt ${attempt}/${retries} Error]: ${err.message}`);
      if (attempt < retries) {
        console.log(`⏳ Retrying MongoDB connection in ${delayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.warn(`⚡  [Storage Engine] Seamlessly activated local persistence layer (server/data/store.json).`);
        console.warn(`👉  To connect to MongoDB Atlas, add MONGODB_URI in server/.env\n`);
        return false;
      }
    }
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDbInfo() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isConn = readyState === 1;
  const host = mongoose.connection.host || '';
  let engine = 'None (Local In-Memory / JSON Store)';
  if (isConn) {
    engine = host.includes('mongodb.net') ? 'MongoDB Atlas' : 'MongoDB Local';
  }

  return {
    connected: isConn,
    status: states[readyState] || 'unknown',
    engine,
    host: isConn ? host : null,
    name: isConn ? mongoose.connection.name : null
  };
}
