import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    },
    meetingId: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    meetingCode: {
      type: String,
      required: true,
      index: true
    },
    courseCode: {
      type: String,
      default: ''
    },
    participantName: {
      type: String,
      required: true
    },
    participantEmail: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'guest', 'user', 'admin'],
      default: 'student'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Left Early', 'Absent'],
      default: 'Present'
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ meetingCode: 1, participantEmail: 1 });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default Attendance;
