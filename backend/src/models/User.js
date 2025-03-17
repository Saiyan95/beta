import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'technician', 'client'],
    required: true
  },
  companyName: {
    type: String,
    required: function() { return this.role === 'client'; }
  },
  department: {
    type: String,
    required: function() { return this.role === 'client'; },
    enum: ['Sales', 'IT', 'HR', 'Purchasing', 'Finance', 'Human Resources', 'Marketing', 'Operations', 'Research & Development', 'Customer Service', 'Legal', 'Other']
  },
  phoneNumber: {
    type: String,
    required: function() { return this.role === 'client'; }
  },
  specialization: {
    type: [String],
    required: function() { return this.role === 'technician'; }
  },
  technicalPrivileges: {
    type: {
      canHandleTickets: { type: Boolean, default: false },
      canUpdateTickets: { type: Boolean, default: false },
      canViewAllTickets: { type: Boolean, default: false },
      canAssignTickets: { type: Boolean, default: false },
      canCloseTickets: { type: Boolean, default: false },
      canAddComments: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false }
    },
    default: function() {
      return this.role === 'technician' ? {
        canHandleTickets: true,
        canUpdateTickets: true,
        canViewAllTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
        canAddComments: true,
        canViewReports: true
      } : undefined;
    }
  },
  activeTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  assignedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  chatHistory: [{
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Add method to update active tickets
userSchema.methods.updateActiveTickets = async function() {
  const Ticket = mongoose.model('Ticket');
  this.activeTickets = await Ticket.find({
    assignedTo: this._id,
    status: { $in: ['open', 'in_progress'] }
  }).select('_id');
  await this.save();
};

// Add method to get ticket statistics
userSchema.methods.getTicketStats = async function() {
  const Ticket = mongoose.model('Ticket');
  const stats = await Ticket.aggregate([
    { $match: { assignedTo: this._id } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
  
  return {
    total: stats.reduce((acc, curr) => acc + curr.count, 0),
    active: stats.find(s => s._id === 'open' || s._id === 'in_progress')?.count || 0,
    completed: stats.find(s => s._id === 'closed')?.count || 0
  };
};

// Add method to add chat message
userSchema.methods.addChatMessage = async function(ticketId, senderId, content) {
  const chatIndex = this.chatHistory.findIndex(chat => chat.ticketId.toString() === ticketId.toString());
  
  if (chatIndex === -1) {
    this.chatHistory.push({
      ticketId,
      messages: [{
        sender: senderId,
        content,
        timestamp: new Date()
      }]
    });
  } else {
    this.chatHistory[chatIndex].messages.push({
      sender: senderId,
      content,
      timestamp: new Date()
    });
  }
  
  await this.save();
};

export default mongoose.model('User', userSchema);
