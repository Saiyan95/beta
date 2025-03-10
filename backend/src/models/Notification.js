import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['new_ticket', 'ticket_update', 'new_message', 'ticket_assigned', 'ticket_accepted'],
    required: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  ticketNumber: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to efficiently find unread notifications for a user
notificationSchema.index({ userId: 1, read: 1 });

// Index for sorting by timestamp (for getting latest notifications)
notificationSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('Notification', notificationSchema);