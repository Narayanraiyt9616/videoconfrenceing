/**
 * test-auth-rbac.js
 * End-to-End Test Suite for CampusVerse Live Authentication & Role-Based Access Control (RBAC)
 * Tests all 14 scenarios specified in the requirements.
 */

import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';
import mongoose from '../server/node_modules/mongoose/index.js';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

const results = [];

function recordTest(scenarioNumber, scenarioName, passed, details = '') {
  results.push({ scenarioNumber, scenarioName, passed, details });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon}: Scenario ${scenarioNumber}. ${scenarioName} -> ${details}`);
}

async function runAuthRBACTests() {
  console.log('\n======================================================');
  console.log('🔒 CAMPUSVERSE LIVE AUTHENTICATION & RBAC TEST SUITE');
  console.log('======================================================\n');

  let facultyToken = '';
  let facultyUser = null;
  let studentToken = '';
  let studentUser = null;
  let adminToken = '';
  let testClassCode = '';
  let testHostToken = '';

  const facultyEmail = `prof.test_${Date.now()}@campusverse.edu`;
  const studentEmail = `student.test_${Date.now()}@campusverse.edu`;
  const defaultPassword = 'Password123!';

  // SCENARIO 13: Existing Login & Registration Continue Working
  try {
    // 13a. Register Faculty
    const regFacultyRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Alok Verma',
        email: facultyEmail,
        password: defaultPassword,
        role: 'faculty',
        department: 'Computer Science'
      })
    });
    const regFacultyData = await regFacultyRes.json();
    facultyToken = regFacultyData.token;
    facultyUser = regFacultyData.user;

    // 13b. Register Student
    const regStudentRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: studentEmail,
        password: defaultPassword,
        role: 'student',
        department: 'Information Technology'
      })
    });
    const regStudentData = await regStudentRes.json();
    studentToken = regStudentData.token;
    studentUser = regStudentData.user;

    // 13c. Login Student
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: defaultPassword })
    });
    const loginData = await loginRes.json();

    const regOk = regFacultyRes.status === 201 && regStudentRes.status === 201 && loginRes.status === 200 && Boolean(loginData.token);
    recordTest(13, 'Existing Login & Registration Continue Working', regOk, `Registered Faculty & Student, Login JWT issued`);
  } catch (err) {
    recordTest(13, 'Existing Login & Registration Continue Working', false, err.message);
  }

  // SCENARIO 1: Logged-out User Opens a Protected Feature/API
  try {
    const unauthScheduleRes = await fetch(`${BACKEND_URL}/api/meetings/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthenticated Lecture' })
    });

    const unauthMyMeetingsRes = await fetch(`${BACKEND_URL}/api/meetings/my`);

    const unauthBlocked = unauthScheduleRes.status === 401 && unauthMyMeetingsRes.status === 401;
    recordTest(1, 'Logged-out User Opens Protected Feature', unauthBlocked, `Blocked with HTTP 401 Unauthorized`);
  } catch (err) {
    recordTest(1, 'Logged-out User Opens Protected Feature', false, err.message);
  }

  // SCENARIO 2: Logged-in Student Opens Student Dashboard
  try {
    const studentProfileRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentProfileData = await studentProfileRes.json();

    const studentClassesRes = await fetch(`${BACKEND_URL}/api/meetings/my`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentClassesData = await studentClassesRes.json();

    const studentDashboardOk =
      studentProfileRes.status === 200 &&
      studentProfileData.user?.role === 'student' &&
      studentProfileData.user?.name === 'Aarav Patel' &&
      studentClassesRes.status === 200;

    recordTest(2, 'Logged-in Student Opens Student Dashboard', studentDashboardOk, `Role: ${studentProfileData.user?.role}, Profile: "${studentProfileData.user?.name}"`);
  } catch (err) {
    recordTest(2, 'Logged-in Student Opens Student Dashboard', false, err.message);
  }

  // SCENARIO 3: Logged-in Faculty Member Opens Faculty Dashboard
  try {
    const facultyProfileRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const facultyProfileData = await facultyProfileRes.json();

    const facultyDashboardOk =
      facultyProfileRes.status === 200 &&
      facultyProfileData.user?.role === 'faculty' &&
      facultyProfileData.user?.name === 'Dr. Alok Verma';

    recordTest(3, 'Logged-in Faculty Opens Faculty Dashboard', facultyDashboardOk, `Role: ${facultyProfileData.user?.role}, Profile: "${facultyProfileData.user?.name}"`);
  } catch (err) {
    recordTest(3, 'Logged-in Faculty Opens Faculty Dashboard', false, err.message);
  }

  // SCENARIO 4: Student Attempts to Access Faculty-Only Route
  try {
    // 4a. Student tries to start instant lecture
    const studentInstantRes = await fetch(`${BACKEND_URL}/api/meetings/instant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Student Hijacked Lecture' })
    });

    // 4b. Student tries to schedule a class
    const studentScheduleRes = await fetch(`${BACKEND_URL}/api/meetings/schedule`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Student Unauthorized Class',
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString()
      })
    });

    // 4c. Student tries to access all attendance records
    const studentAttendanceRes = await fetch(`${BACKEND_URL}/api/meetings/KAL-TEST/attendance`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    const studentBlockedFromFaculty =
      studentInstantRes.status === 403 &&
      studentScheduleRes.status === 403 &&
      studentAttendanceRes.status === 403;

    recordTest(4, 'Student Blocked from Faculty-Only Actions', studentBlockedFromFaculty, `Instant (403), Schedule (403), Attendance (403)`);
  } catch (err) {
    recordTest(4, 'Student Blocked from Faculty-Only Actions', false, err.message);
  }

  // SCENARIO 8: Authorized Faculty Starts a Live Lecture
  try {
    const facultyLectureRes = await fetch(`${BACKEND_URL}/api/meetings/instant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'CS502: Advanced Algorithms & Cryptography',
        isClassroom: true,
        courseCode: 'CS502'
      })
    });
    const facultyLectureData = await facultyLectureRes.json();
    testClassCode = facultyLectureData.meeting?.code || facultyLectureData.meeting?.meetingCode;
    testHostToken = facultyLectureData.meeting?.hostToken;

    const lectureCreated = facultyLectureRes.status === 201 && Boolean(testClassCode) && Boolean(testHostToken);
    recordTest(8, 'Authorized Faculty Starts Live Lecture', lectureCreated, `Code: ${testClassCode}, HostToken verified`);
  } catch (err) {
    recordTest(8, 'Authorized Faculty Starts Live Lecture', false, err.message);
  }

  // SCENARIO 7: Authorized Student Joins Valid Meeting
  try {
    // 7a. Validate meeting info
    const validateRes = await fetch(`${BACKEND_URL}/api/meetings/${testClassCode}`);
    const validateData = await validateRes.json();

    // 7b. Socket join with verified role
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket timeout')), 4000);
      socket.on('connect', () => {
        socket.emit(
          'room:join',
          {
            roomCode: testClassCode,
            name: 'Aarav Patel',
            avatar: '🎒',
            email: studentEmail,
            role: 'student',
            isHost: false
          },
          (res) => {
            clearTimeout(timeout);
            socket.disconnect();
            if (res.success && res.participant?.role === 'student' && res.participant?.isHost === false) {
              resolve(res);
            } else {
              reject(new Error(res.error || 'Student role not preserved'));
            }
          }
        );
      });
    });

    const studentJoinedOk = validateRes.status === 200 && validateData.exists === true;
    recordTest(7, 'Authorized Student Joins Valid Meeting', studentJoinedOk, `Joined ${testClassCode} with role: student, isHost: false`);
  } catch (err) {
    recordTest(7, 'Authorized Student Joins Valid Meeting', false, err.message);
  }

  // SCENARIO 5: Student Attempts to Access Restricted Meeting Action (e.g. End Class for All)
  try {
    const studentEndRes = await fetch(`${BACKEND_URL}/api/meetings/${testClassCode}/end`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    const studentEndBlocked = studentEndRes.status === 403;
    recordTest(5, 'Student Blocked from Terminating Meeting', studentEndBlocked, `End Class blocked with HTTP 403 Forbidden`);
  } catch (err) {
    recordTest(5, 'Student Blocked from Terminating Meeting', false, err.message);
  }

  // SCENARIO 6: Unauthorized Faculty Attempts to Terminate Another Faculty's Meeting
  try {
    // Register second faculty
    const otherFacultyEmail = `prof.other_${Date.now()}@campusverse.edu`;
    const regOtherRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Meera Nambiar',
        email: otherFacultyEmail,
        password: defaultPassword,
        role: 'faculty',
        department: 'Mathematics'
      })
    });
    const regOtherData = await regOtherRes.json();

    // Try to end first faculty's class without hostToken
    const unauthorizedEndRes = await fetch(`${BACKEND_URL}/api/meetings/${testClassCode}/end`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${regOtherData.token}`
      }
    });

    const unauthorizedEndBlocked = unauthorizedEndRes.status === 403;
    recordTest(6, 'Non-Owner Faculty Blocked from Terminating Class', unauthorizedEndBlocked, `Blocked with HTTP 403 Forbidden`);
  } catch (err) {
    recordTest(6, 'Non-Owner Faculty Blocked from Terminating Class', false, err.message);
  }

  // SCENARIO 9: User Refreshes a Protected Page (Token Persistence)
  try {
    // Re-verify token against /api/auth/me simulates page refresh
    const refreshRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const refreshData = await refreshRes.json();

    const refreshOk = refreshRes.status === 200 && refreshData.user?.email === facultyEmail;
    recordTest(9, 'User Refreshes Protected Page', refreshOk, `Session restored from token for ${refreshData.user?.email}`);
  } catch (err) {
    recordTest(9, 'User Refreshes Protected Page', false, err.message);
  }

  // SCENARIO 10: User Logs Out and Attempts to Reopen Protected Page
  try {
    // Simulated logout by omitting/nullifying token
    const postLogoutRes = await fetch(`${BACKEND_URL}/api/meetings/my`, {
      headers: { Authorization: '' }
    });

    const logoutBlocked = postLogoutRes.status === 401;
    recordTest(10, 'Logged-Out User Blocked from Protected Page', logoutBlocked, `Access denied with HTTP 401 after logout`);
  } catch (err) {
    recordTest(10, 'Logged-Out User Blocked from Protected Page', false, err.message);
  }

  // SCENARIO 11: Session Expires During Navigation
  try {
    const fakeExpiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImV4cCI6MTYwMDAwMDAwMH0.signature';
    const expiredRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${fakeExpiredToken}` }
    });
    const expiredData = await expiredRes.json();

    const expiredHandled = expiredRes.status === 401 && expiredData.error?.includes('expired');
    recordTest(11, 'Session Expiration Handled Cleanly', expiredHandled, `HTTP 401: "${expiredData.error}"`);
  } catch (err) {
    recordTest(11, 'Session Expiration Handled Cleanly', false, err.message);
  }

  // SCENARIO 12: Direct Meeting Links Preserve Authentication & Permissions
  try {
    // Querying meeting code via API works with token
    const directRes = await fetch(`${BACKEND_URL}/api/meetings/${testClassCode}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const directData = await directRes.json();

    const directOk = directRes.status === 200 && directData.meeting?.code === testClassCode;
    recordTest(12, 'Direct Meeting Link Access Validated', directOk, `Class code ${testClassCode} resolved with authenticated student token`);
  } catch (err) {
    recordTest(12, 'Direct Meeting Link Access Validated', false, err.message);
  }

  // SCENARIO 14: Existing Frontend, Backend, Database, and Meeting Provider Connected
  try {
    const healthRes = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthRes.json();
    const frontendRes = await fetch(FRONTEND_URL);

    const fullStackOk =
      healthRes.status === 200 &&
      healthData.databaseConnected === true &&
      frontendRes.status === 200;

    recordTest(14, 'Full Stack Ecosystem Connected & Operational', fullStackOk, `Backend 200, Frontend 200, DB: ${healthData.database} (${healthData.databaseHost})`);
  } catch (err) {
    recordTest(14, 'Full Stack Ecosystem Connected & Operational', false, err.message);
  }

  // SUMMARY REPORT
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  console.log('\n======================================================');
  console.log(`📊 FINAL RBAC RESULTS: ${passedTests} / ${totalTests} SCENARIOS PASSED`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL 14 SCENARIOS TESTED AND VERIFIED WITH 100% SUCCESS!');
  } else {
    console.log('⚠️ SOME SCENARIOS FAILED. CHECK LOGS ABOVE.');
  }
  console.log('======================================================\n');
}

runAuthRBACTests().catch(console.error);
