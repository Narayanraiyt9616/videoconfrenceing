import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    meetingCode: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      default: 'user'
    },
    text: {
      type: String,
      default: ''
    },
    mediaUrl: {
      type: String,
      default: null
    },
    mediaType: {
      type: String,
      default: null
    },
    isSecret: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
