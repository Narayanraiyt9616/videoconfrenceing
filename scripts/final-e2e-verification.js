/**
 * Final Comprehensive End-to-End Verification Test Suite
 * MeetHub / Aaj Ka Kalesh (MERN Stack)
 */

import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';
import mongoose from '../server/node_modules/mongoose/index.js';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

import { connectDB, isDbConnected } from '../server/config/db.js';
import { User } from '../server/models/User.js';
import { Meeting } from '../server/models/Meeting.js';
import { Attendance } from '../server/models/Attendance.js';

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name}${details ? ` -> ${details}` : ''}`);
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING FINAL END-TO-END VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  // Verify direct Atlas connection
  try {
    const connSuccess = await connectDB();
    if (connSuccess && isDbConnected()) {
      console.log(`📦 [Test Suite] Connected to Atlas DB: ${mongoose.connection.name} on ${mongoose.connection.host}\n`);
    } else {
      console.warn('⚠️ Atlas connection fallback active.');
    }
  } catch (err) {
    console.warn('Atlas note:', err.message);
  }

  // 1. Port & Server Status Verification
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/health`);
    const frontendRes = await fetch(`${FRONTEND_URL}`);
    const bothOk = backendRes.ok && frontendRes.ok;
    recordTest('1. Backend (:5000) & Frontend (:5173) Server Execution', bothOk, `Backend HTTP ${backendRes.status}, Frontend HTTP ${frontendRes.status}`);
  } catch (err) {
    recordTest('1. Backend (:5000) & Frontend (:5173) Server Execution', false, err.message);
  }

  // 2. Health Endpoint & MongoDB Atlas Status Verification
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const health = await res.json();
    const isAtlas = health.database === 'MongoDB Atlas' && health.databaseConnected === true && health.databaseStatus === 'connected';
    recordTest(
      '2. Health Endpoint Live MongoDB Atlas Status',
      isAtlas,
      `Engine: "${health.database}", Connected: ${health.databaseConnected}, Host: "${health.databaseHost}"`
    );
  } catch (err) {
    recordTest('2. Health Endpoint Live MongoDB Atlas Status', false, err.message);
  }

  // 3. Frontend Reverse Proxy & CORS Verification
  try {
    const proxyRes = await fetch(`${FRONTEND_URL}/api/health`);
    const proxyData = await proxyRes.json();
    const proxyOk = proxyRes.ok && proxyData.databaseConnected === true;
    recordTest('3. Frontend Reverse Proxy (/api -> :5000)', proxyOk, `Proxy status ${proxyRes.status}, forwarded database: ${proxyData.database}`);
  } catch (err) {
    recordTest('3. Frontend Reverse Proxy (/api -> :5000)', false, err.message);
  }

  // 4. User Registration API & Database Write Verification
  const testEmail = `e2e_admin_${Date.now()}@campusverse.edu`;
  const testPassword = 'SecurePassword123!';
  let authToken = '';
  let userId = '';

  try {
    const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prof. Vikram Malhotra',
        email: testEmail,
        password: testPassword,
        role: 'admin',
        department: 'Computer Science'
      })
    });
    const regData = await regRes.json();
    authToken = regData.token;
    userId = regData.user?.id;

    // Verify document in MongoDB Atlas
    const userDoc = await User.findOne({ email: testEmail });
    const isSavedInAtlas = Boolean(userDoc && userDoc.name === 'Prof. Vikram Malhotra' && userDoc.password !== testPassword);

    recordTest(
      '4. User Registration API & MongoDB Atlas Write',
      regRes.status === 201 && isSavedInAtlas && Boolean(authToken),
      `User created with ID ${userId}, hashed in Atlas collection 'users'`
    );
  } catch (err) {
    recordTest('4. User Registration API & MongoDB Atlas Write', false, err.message);
  }

  // 5. User Login & Authentication API Verification
  try {
    // Valid login
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();

    // Invalid password test
    const badLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' })
    });

    // Profile retrieval with Bearer token
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();

    const authOk = loginRes.status === 200 && badLoginRes.status === 401 && meRes.status === 200 && meData.user?.email === testEmail;
    recordTest(
      '5. User Login, Password Rejection & Auth Profile (/api/auth/me)',
      authOk,
      `Login OK (200), Bad password rejected (401), Profile retrieved (200)`
    );
  } catch (err) {
    recordTest('5. User Login, Password Rejection & Auth Profile (/api/auth/me)', false, err.message);
  }

  // 6. Instant Meeting Creation & MongoDB Atlas Write
  let instantCode = '';
  let hostToken = '';
  try {
    const instantRes = await fetch(`${BACKEND_URL}/api/meetings/instant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'E2E Instant Lecture' })
    });
    const instantData = await instantRes.json();
    instantCode = instantData.meeting?.code || instantData.meeting?.meetingCode;
    hostToken = instantData.meeting?.hostToken;

    // Verify document in Atlas
    const meetingDoc = await Meeting.findOne({ meetingCode: instantCode });
    const meetingSaved = Boolean(meetingDoc && meetingDoc.title === 'E2E Instant Lecture');

    recordTest(
      '6. Instant Meeting Creation & MongoDB Atlas Write',
      instantRes.status === 201 && meetingSaved,
      `Code: ${instantCode}, HostToken: ${hostToken ? hostToken.slice(0, 8) + '...' : 'none'}, Saved in Atlas`
    );
  } catch (err) {
    recordTest('6. Instant Meeting Creation & MongoDB Atlas Write', false, err.message);
  }

  // 7. Scheduled Meeting Creation & MongoDB Atlas Write
  let scheduledCode = '';
  try {
    const schedRes = await fetch(`${BACKEND_URL}/api/meetings/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Distributed Systems & Cloud Architecture',
        isClassroom: true,
        courseCode: 'CS402',
        scheduledStartTime: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 90
      })
    });
    const schedData = await schedRes.json();
    scheduledCode = schedData.meeting?.code || schedData.meeting?.meetingCode;

    const schedDoc = await Meeting.findOne({ meetingCode: scheduledCode });
    const schedSaved = Boolean(schedDoc && schedDoc.isClassroom === true && schedDoc.courseCode === 'CS402');

    recordTest(
      '7. Scheduled Classroom Meeting & MongoDB Atlas Write',
      schedRes.status === 201 && schedSaved,
      `Code: ${scheduledCode}, Course: CS402, Saved in Atlas`
    );
  } catch (err) {
    recordTest('7. Scheduled Classroom Meeting & MongoDB Atlas Write', false, err.message);
  }

  // 8. Meeting Retrieval & Details API
  try {
    const detailsRes = await fetch(`${BACKEND_URL}/api/meetings/${instantCode}`);
    const detailsData = await detailsRes.json();
    const retrievedCode = detailsData.meeting?.code || detailsData.meeting?.meetingCode;
    const detailsOk = detailsRes.status === 200 && retrievedCode === instantCode;
    recordTest('8. Meeting Details API (/api/meetings/:code)', detailsOk, `Retrieved title: "${detailsData.meeting?.title}"`);
  } catch (err) {
    recordTest('8. Meeting Details API (/api/meetings/:code)', false, err.message);
  }

  // 9. iCalendar RFC 5545 Export
  try {
    const icsRes = await fetch(`${BACKEND_URL}/api/meetings/${scheduledCode}/calendar.ics`);
    const icsText = await icsRes.text();
    const icsOk = icsRes.status === 200 && icsText.includes('BEGIN:VCALENDAR') && icsText.includes('Distributed Systems');
    recordTest('9. iCalendar (.ics) RFC 5545 Export', icsOk, `Generated valid VCALENDAR with event summary`);
  } catch (err) {
    recordTest('9. iCalendar (.ics) RFC 5545 Export', false, err.message);
  }

  // 10. Real-time Meeting Joining, Door Knocking & WebRTC Signaling
  let socketHost = null;
  let socketStudent = null;
  let webrtcSignalingWorked = false;
  let chatMessageWorked = false;

  try {
    socketHost = io(BACKEND_URL, { transports: ['websocket'] });
    socketStudent = io(BACKEND_URL, { transports: ['websocket'] });

    await new Promise((resolve, reject) => {
      let connectedCount = 0;
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
      const onConn = () => {
        connectedCount++;
        if (connectedCount === 2) {
          clearTimeout(timeout);
          resolve();
        }
      };
      socketHost.on('connect', onConn);
      socketStudent.on('connect', onConn);
    });

    // Host joins room
    await new Promise((resolve) => {
      socketHost.emit('room:join', {
        roomCode: instantCode,
        name: 'Prof. Vikram Malhotra (Host)',
        role: 'faculty',
        isHost: true,
        hostToken
      }, resolve);
    });

    // Student knocks on door -> Host approves
    const hostKnockPromise = new Promise((resolve) => {
      socketHost.on('host:knock-received', (knock) => {
        socketHost.emit('host:approve-knock', { targetSocketId: knock.socketId });
        resolve(knock);
      });
    });

    const studentApprovedPromise = new Promise((resolve) => {
      socketStudent.on('room:knock-approved', resolve);
    });

    socketStudent.emit('room:knock', { roomCode: instantCode, name: 'Aarav Gupta', avatar: '👨‍🎓' });
    await Promise.all([hostKnockPromise, studentApprovedPromise]);

    // Student joins room
    await new Promise((resolve) => {
      socketStudent.emit('room:join', {
        roomCode: instantCode,
        name: 'Aarav Gupta',
        role: 'student',
        isHost: false
      }, resolve);
    });

    // Test WebRTC signaling mesh
    const hostAnswerPromise = new Promise((resolve) => {
      socketHost.on('video:answer', resolve);
    });

    const studentOfferPromise = new Promise((resolve) => {
      socketStudent.on('video:offer', ({ from, offer }) => {
        socketStudent.emit('video:answer', {
          to: from,
          answer: { type: 'answer', sdp: 'dummy-sdp-answer-verified' }
        });
        resolve();
      });
    });

    socketHost.emit('video:offer', {
      to: socketStudent.id,
      offer: { type: 'offer', sdp: 'dummy-sdp-offer-verified' }
    });

    await Promise.all([studentOfferPromise, hostAnswerPromise]);
    webrtcSignalingWorked = true;

    recordTest(
      '10. Real-time Meeting Joining, Door Knocking & WebRTC Signaling',
      webrtcSignalingWorked,
      `Knock approved, both peers joined, WebRTC offer/answer exchanged`
    );

    // 11. Real-time Live Chat
    const chatPromise = new Promise((resolve) => {
      socketHost.on('chat:message', (msg) => {
        if (msg.text === 'Good morning Sir!') {
          chatMessageWorked = true;
          resolve();
        }
      });
    });

    socketStudent.emit('chat:send', { text: 'Good morning Sir!' });
    await chatPromise;

    recordTest('11. Real-time Chat Delivery', chatMessageWorked, `Message received by Host in real-time`);

    // 12. Attendance Recording & Persistence in MongoDB Atlas
    socketStudent.disconnect();
    await new Promise((r) => setTimeout(r, 600));

    const attendanceRecords = await Attendance.find({ meetingCode: instantCode });
    const attendanceSaved = attendanceRecords.length > 0;
    recordTest(
      '12. Attendance Recording in MongoDB Atlas',
      attendanceSaved,
      `Recorded ${attendanceRecords.length} attendee(s) in Atlas collection 'attendances'`
    );

    // 13. Admin Statistics API
    const statsRes = await fetch(`${BACKEND_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const statsData = await statsRes.json();
    const statsOk = statsRes.status === 200 && typeof statsData.stats?.totalUsers === 'number';
    recordTest('13. Admin Platform Statistics (/api/admin/stats)', statsOk, `Total Users: ${statsData.stats?.totalUsers}, Total Meetings: ${statsData.stats?.totalMeetings}`);

    // 14. Meeting Termination & Ephemeral Memory Wipe
    socketHost.emit('room:end');
    await new Promise((r) => setTimeout(r, 600));

    const endedMeetingDoc = await Meeting.findOne({ meetingCode: instantCode });
    const meetingEndedInAtlas = endedMeetingDoc && endedMeetingDoc.status === 'ended';

    // Verify meeting marked ended in Atlas and returns HTTP 410
    const endedRes = await fetch(`${BACKEND_URL}/api/meetings/${instantCode}`);
    const isEndedHttp410 = endedRes.status === 410;

    recordTest(
      '14. Meeting Termination & Ephemeral Memory Wipe',
      meetingEndedInAtlas && isEndedHttp410,
      `Status updated to 'ended' in Atlas; API confirms meeting ended (HTTP 410 Gone)`
    );

  } catch (err) {
    recordTest('10-14. Real-time Socket & Meeting Lifecycle', false, err.message);
  } finally {
    if (socketHost?.connected) socketHost.disconnect();
    if (socketStudent?.connected) socketStudent.disconnect();
  }

  // 15. Frontend Compilation & Asset Delivery Verification
  try {
    const mainJs = await fetch(`${FRONTEND_URL}/src/main.jsx`);
    const appJs = await fetch(`${FRONTEND_URL}/src/App.jsx`);
    const scheduleModal = await fetch(`${FRONTEND_URL}/src/components/meeting/ScheduleMeetingModal.jsx`);
    const frontendAssetsOk = mainJs.status === 200 && appJs.status === 200 && scheduleModal.status === 200;
    recordTest(
      '15. Frontend Compilation & Component Assets Delivery',
      frontendAssetsOk,
      `main.jsx (${mainJs.status}), App.jsx (${appJs.status}), ScheduleMeetingModal.jsx (${scheduleModal.status})`
    );
  } catch (err) {
    recordTest('15. Frontend Compilation & Component Assets Delivery', false, err.message);
  }

  // Clean up test documents in Atlas
  try {
    await User.deleteMany({ email: testEmail });
    await Meeting.deleteMany({ meetingCode: { $in: [instantCode, scheduledCode] } });
    await Attendance.deleteMany({ meetingCode: instantCode });
  } catch {}

  await mongoose.disconnect();

  console.log('\n======================================================');
  const allPassed = results.every(r => r.passed);
  const passCount = results.filter(r => r.passed).length;
  console.log(`📊 FINAL RESULTS: ${passCount} / ${results.length} TESTS PASSED`);
  console.log(allPassed ? '🎉 ALL 15 CRITICAL E2E CRITERIA VERIFIED AND PASSED WITH 100% SUCCESS!' : '⚠️ SOME TESTS FAILED');
  console.log('======================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal Suite Error:', err);
  process.exit(1);
});
