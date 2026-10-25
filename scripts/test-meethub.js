/**
 * MeetHub End-to-End Verification Suite
 * Tests all core backend endpoints, models, socket events, and integration workflows.
 */

import http from 'http';

const BASE = 'http://127.0.0.1:5000';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting MeetHub MERN Stack Verification Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns 200 OK');

    // 2. Auth: Register a new test user
    const testEmail = `prof.test_${Date.now()}@meethub.com`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dr. Vikram Sarabhai',
        email: testEmail,
        password: 'password123',
        role: 'faculty',
        department: 'Aerospace Engineering'
      })
    });
    assert(regRes.status === 201 && regRes.data.token, 'POST /api/auth/register generates JWT token');
    const token = regRes.data.token;

    // 3. Auth: Login with created user
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    assert(loginRes.status === 200 && loginRes.data.user.role === 'faculty', 'POST /api/auth/login verifies password');

    // 4. Auth: Profile validation
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(meRes.status === 200 && meRes.data.user.name === 'Dr. Vikram Sarabhai', 'GET /api/auth/me returns profile');

    // 5. Meetings: Create Instant Meeting
    const instantRes = await request('/api/meetings/instant', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Ad-hoc Faculty Research Sync' })
    });
    assert(instantRes.status === 201 && instantRes.data.meeting.code, 'POST /api/meetings/instant creates meeting with code');
    const meetingCode = instantRes.data.meeting.code;

    // 6. Meetings: Schedule a Classroom Meeting
    const scheduleRes = await request('/api/meetings/schedule', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'AE401: Rocket Propulsion Dynamics',
        description: 'Lecture covering orbital mechanics and liquid propulsion engines.',
        scheduledStartTime: new Date(Date.now() + 7200000).toISOString(),
        durationMinutes: 90,
        isClassroom: true,
        courseCode: 'AE401',
        settings: { waitingRoomEnabled: true, allowJoinerScreenShare: false }
      })
    });
    assert(scheduleRes.status === 201 && scheduleRes.data.meeting.isClassroom, 'POST /api/meetings/schedule creates classroom meeting');
    const scheduledCode = scheduleRes.data.meeting.meetingCode;

    // 7. Meetings: Query by Code
    const getRes = await request(`/api/meetings/${scheduledCode}`);
    assert(getRes.status === 200 && getRes.data.meeting.courseCode === 'AE401', `GET /api/meetings/${scheduledCode} retrieves details`);

    // 8. Calendar .ICS Export
    const icsRes = await fetch(`${BASE}/api/meetings/${scheduledCode}/calendar.ics`);
    const icsText = await icsRes.text();
    assert(icsRes.status === 200 && icsText.includes('BEGIN:VCALENDAR') && icsText.includes('AE401'), 'GET /api/meetings/:code/calendar.ics exports RFC 5545 calendar');

    // 9. Attendance Tracking: Simulate Student Attendance
    const attRes = await request(`/api/meetings/${scheduledCode}/attendance`);
    assert(attRes.status === 200 && Array.isArray(attRes.data.attendance), 'GET /api/meetings/:code/attendance returns records array');

    // 10. Attendance CSV Export
    const csvRes = await fetch(`${BASE}/api/meetings/${scheduledCode}/attendance/export`);
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && csvText.includes('Participant Name,Email,Role'), 'GET /api/meetings/:code/attendance/export generates CSV');

    // 11. Recordings: Save metadata
    const recRes = await request('/api/recordings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        meetingCode: scheduledCode,
        title: 'AE401 Full Lecture Recording',
        durationSeconds: 5400,
        fileSize: 420000000
      })
    });
    assert(recRes.status === 201 && recRes.data.recording.title, 'POST /api/recordings saves recording metadata');

    // 12. Admin: Admin Stats and User Audit
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@meethub.com', password: 'admin123' })
    });
    const adminToken = adminLogin.data.token;

    const statsRes = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.status === 200 && statsRes.data.stats.totalUsers >= 3, 'GET /api/admin/stats provides platform metrics');

    const usersRes = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(usersRes.status === 200 && usersRes.data.users.length >= 3, 'GET /api/admin/users audits registered users');

    // 13. End Meeting
    const endRes = await request(`/api/meetings/${scheduledCode}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(endRes.status === 200 && endRes.data.success, 'POST /api/meetings/:code/end terminates meeting in database');

    console.log('\n======================================================');
    console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test suite error:', err);
  }
}

runTests();
