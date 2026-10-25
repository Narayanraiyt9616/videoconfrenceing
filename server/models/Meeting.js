import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'MeetHub Video Conference'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    hostId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    hostName: {
      type: String,
      default: 'Host'
    },
    hostEmail: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'ended'],
      default: 'ongoing'
    },
    scheduledStartTime: {
      type: Date,
      default: Date.now
    },
    durationMinutes: {
      type: Number,
      default: 60
    },
    passcode: {
      type: String,
      default: ''
    },
    isClassroom: {
      type: Boolean,
      default: false
    },
    courseCode: {
      type: String,
      default: ''
    },
    settings: {
      allowJoinerChat: { type: Boolean, default: true },
      allowJoinerScreenShare: { type: Boolean, default: true },
      allowJoinerUnmute: { type: Boolean, default: true },
      isLocked: { type: Boolean, default: false },
      waitingRoomEnabled: { type: Boolean, default: false }
    },
    participantsHistory: [
      {
        socketId: String,
        name: String,
        email: String,
        role: String,
        joinedAt: { type: Date, default: Date.now },
        leftAt: Date,
        durationSeconds: { type: Number, default: 0 }
      }
    ],
    endedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

meetingSchema.index({ hostId: 1, createdAt: -1 });
meetingSchema.index({ status: 1, scheduledStartTime: 1 });

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
export default Meeting;
