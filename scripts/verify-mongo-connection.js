import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isDbConnected } from '../server/config/db.js';
import { User } from '../server/models/User.js';
import { Meeting } from '../server/models/Meeting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

async function verifyMongoAtlas() {
  console.log('\n======================================================');
  console.log('🧪 Verifying MongoDB Atlas Connection & Data Integrity');
  console.log('======================================================\n');

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.error('❌ MONGODB_URI is not set in server/.env.');
    console.log('👉 Please paste your MongoDB Atlas connection string into server/.env:\n');
    console.log('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/meethub?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  // Mask credentials for terminal output
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`📡 Connecting to: ${maskedUri}`);
  console.log(`📂 Database: meethub\n`);

  try {
    const success = await connectDB();
    if (!success || !isDbConnected()) {
      throw new Error('connectDB did not establish an active connection.');
    }

    console.log('✅ PASS: Successfully connected to MongoDB Atlas cluster!');

    // 1. Check database collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Collections present: ${collections.map(c => c.name).join(', ') || 'none yet'}`);

    // 2. Verify data migration
    const userCount = await User.countDocuments();
    const meetingCount = await Meeting.countDocuments();
    console.log(`👥 Total Users in MongoDB: ${userCount}`);
    console.log(`📅 Total Meetings in MongoDB: ${meetingCount}`);

    // 3. Test User Registration / Query
    const testEmail = `atlas_verify_${Date.now()}@meethub.com`;
    const testUser = await User.create({
      name: 'Atlas Verification User',
      email: testEmail,
      password: 'AtlasPassword123!',
      role: 'faculty',
      department: 'Computer Science'
    });
    console.log(`✅ PASS: User creation verified on Atlas: ${testUser.email}`);

    // 4. Test Password Comparison
    const userWithPw = await User.findOne({ email: testEmail }).select('+password');
    const isMatch = await userWithPw.matchPassword('AtlasPassword123!');
    if (!isMatch) throw new Error('Password verification failed on Atlas user');
    console.log('✅ PASS: Password authentication & hashing verified on Atlas');

    // 5. Test Meeting Creation
    const testMtg = await Meeting.create({
      meetingCode: `ATL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: 'MongoDB Atlas Integration Verification Session',
      hostName: 'Atlas Verification User',
      hostEmail: testEmail,
      status: 'scheduled',
      isClassroom: true,
      courseCode: 'CS500'
    });
    console.log(`✅ PASS: Meeting creation verified on Atlas: ${testMtg.meetingCode}`);

    // Clean up test documents
    await User.deleteOne({ _id: testUser._id });
    await Meeting.deleteOne({ _id: testMtg._id });
    console.log('🧹 Cleaned up temporary test documents.');

    console.log('\n======================================================');
    console.log('🎉 MongoDB Atlas integration completely verified!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MongoDB Atlas verification failed:', err.message);
    process.exit(1);
  }
}

verifyMongoAtlas();
