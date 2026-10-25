import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    },
    meetingCode: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    hostId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    hostName: {
      type: String,
      default: 'Host'
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileUrl: {
      type: String,
      default: ''
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Recording = mongoose.models.Recording || mongoose.model('Recording', recordingSchema);
export default Recording;
