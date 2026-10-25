import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isDbConnected } from '../config/db.js';
import { User } from '../models/User.js';
import { Meeting } from '../models/Meeting.js';
import { Attendance } from '../models/Attendance.js';
import { Recording } from '../models/Recording.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runCRUDTests() {
  console.log('\n======================================================');
  console.log('🧪 Running Comprehensive MongoDB Atlas CRUD Test Suite');
  console.log('======================================================\n');

  try {
    const success = await connectDB();
    if (!success || !isDbConnected()) {
      throw new Error('Could not establish connection to MongoDB Atlas.');
    }
    console.log('✅ Connected to MongoDB Atlas cluster on db "meethub"\n');

    // --- 1. USER CRUD ---
    console.log('--- 1. Testing USER Collection ---');
    const userEmail = `crud_test_${Date.now()}@meethub.com`;
    // Create
    const user = await User.create({
      name: 'CRUD Test User',
      email: userEmail,
      password: 'StrongPassword123!',
      role: 'student',
      department: 'Data Science'
    });
    console.log(`  [C] Created User: ID=${user._id}, Email=${user.email}`);

    // Read
    const foundUser = await User.findById(user._id).select('+password');
    if (!foundUser || foundUser.email !== userEmail) throw new Error('User read failed');
    const authOk = await foundUser.matchPassword('StrongPassword123!');
    if (!authOk) throw new Error('Password authentication failed on created user');
    console.log(`  [R] Read User & Verified Password Match: OK`);

    // Update
    foundUser.department = 'Advanced Artificial Intelligence';
    foundUser.role = 'faculty';
    await foundUser.save();
    const updatedUser = await User.findById(user._id);
    if (updatedUser.department !== 'Advanced Artificial Intelligence' || updatedUser.role !== 'faculty') {
      throw new Error('User update verification failed');
    }
    console.log(`  [U] Updated User role to "${updatedUser.role}" & department: OK`);

    // Delete
    await User.findByIdAndDelete(user._id);
    const deletedCheck = await User.findById(user._id);
    if (deletedCheck !== null) throw new Error('User deletion failed');
    console.log(`  [D] Deleted User & Verified Non-existence: OK\n`);

    // --- 2. MEETING CRUD ---
    console.log('--- 2. Testing MEETING Collection ---');
    const testCode = `TST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    // Create
    const meeting = await Meeting.create({
      meetingCode: testCode,
      title: 'CRUD Verification Lecture',
      description: 'Testing live updates and database triggers',
      hostName: 'Test Faculty',
      hostEmail: 'test.faculty@meethub.com',
      status: 'scheduled',
      durationMinutes: 60,
      isClassroom: true,
      courseCode: 'CS999'
    });
    console.log(`  [C] Created Meeting: Code=${meeting.meetingCode}, Title="${meeting.title}"`);

    // Read
    const foundMtg = await Meeting.findOne({ meetingCode: testCode });
    if (!foundMtg || foundMtg.courseCode !== 'CS999') throw new Error('Meeting read failed');
    console.log(`  [R] Read Meeting: OK`);

    // Update
    foundMtg.status = 'ongoing';
    foundMtg.durationMinutes = 90;
    await foundMtg.save();
    const updatedMtg = await Meeting.findOne({ meetingCode: testCode });
    if (updatedMtg.status !== 'ongoing' || updatedMtg.durationMinutes !== 90) {
      throw new Error('Meeting update failed');
    }
    console.log(`  [U] Updated Meeting status to "${updatedMtg.status}" & duration to ${updatedMtg.durationMinutes}m: OK`);

    // Delete
    await Meeting.deleteOne({ meetingCode: testCode });
    const deletedMtgCheck = await Meeting.findOne({ meetingCode: testCode });
    if (deletedMtgCheck !== null) throw new Error('Meeting deletion failed');
    console.log(`  [D] Deleted Meeting & Verified Non-existence: OK\n`);

    // --- 3. ATTENDANCE CRUD ---
    console.log('--- 3. Testing ATTENDANCE Collection ---');
    const attCode = `ATT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    // Create
    const attendance = await Attendance.create({
      meetingCode: attCode,
      courseCode: 'CS101',
      participantName: 'Neha Verma',
      participantEmail: 'neha@meethub.com',
      role: 'student',
      status: 'Present'
    });
    console.log(`  [C] Created Attendance record for ${attendance.participantName}`);

    // Read
    const foundAtt = await Attendance.findOne({ meetingCode: attCode, participantName: 'Neha Verma' });
    if (!foundAtt) throw new Error('Attendance read failed');
    console.log(`  [R] Read Attendance record: OK`);

    // Update (Student leaves room)
    foundAtt.leftAt = new Date();
    foundAtt.durationMinutes = 45;
    await foundAtt.save();
    const updatedAtt = await Attendance.findById(attendance._id);
    if (!updatedAtt.leftAt || updatedAtt.durationMinutes !== 45) {
      throw new Error('Attendance update failed');
    }
    console.log(`  [U] Updated Attendance leave timestamp & duration (${updatedAtt.durationMinutes}m): OK`);

    // Delete
    await Attendance.deleteOne({ _id: attendance._id });
    const deletedAttCheck = await Attendance.findById(attendance._id);
    if (deletedAttCheck !== null) throw new Error('Attendance deletion failed');
    console.log(`  [D] Deleted Attendance record & Verified: OK\n`);

    // --- 4. RECORDING CRUD ---
    console.log('--- 4. Testing RECORDING Collection ---');
    const recCode = `REC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    // Create
    const recording = await Recording.create({
      meetingCode: recCode,
      title: 'Distributed Systems Lecture Recording',
      hostName: 'Prof. Sharma',
      durationSeconds: 3600,
      fileSize: 45000000,
      fileUrl: 'https://storage.meethub.com/rec/test.mp4'
    });
    console.log(`  [C] Created Recording: ID=${recording._id}, Title="${recording.title}"`);

    // Read
    const foundRec = await Recording.findById(recording._id);
    if (!foundRec || foundRec.meetingCode !== recCode) throw new Error('Recording read failed');
    console.log(`  [R] Read Recording: OK`);

    // Update
    foundRec.title = 'Updated Lecture Recording (Final Edit)';
    await foundRec.save();
    const updatedRec = await Recording.findById(recording._id);
    if (updatedRec.title !== 'Updated Lecture Recording (Final Edit)') {
      throw new Error('Recording update failed');
    }
    console.log(`  [U] Updated Recording title: OK`);

    // Delete
    await Recording.deleteOne({ _id: recording._id });
    const deletedRecCheck = await Recording.findById(recording._id);
    if (deletedRecCheck !== null) throw new Error('Recording deletion failed');
    console.log(`  [D] Deleted Recording & Verified: OK\n`);

    console.log('======================================================');
    console.log('🎉 ALL CRUD OPERATIONS VERIFIED SUCCESSFULLY ON ATLAS!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ CRUD Verification failed:', err.message);
    process.exit(1);
  }
}

runCRUDTests();
