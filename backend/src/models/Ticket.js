import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store client details directly in the ticket for easier access
  clientDetails: {
    firstName: String,
    lastName: String,
    companyName: String,
    username: String,
    department: String,
    phoneNumber: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'on_hold', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  product: {
    name: {
      type: String,
      required: true
    },
    // For software products
    type: {
      type: String,
      default: ''
    },
    // For hardware products
    serialNumber: String,
    warrantyStatus: {
      inWarranty: {
        type: Boolean,
        default: false
      },
      expiryDate: Date
    }
  },
  description: {
    type: String,
    required: false,
    default: '',
    maxlength: 1000
  },
  numberOfUsers: {
    type: Number,
    default: 1
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Auto-generate ticket number before saving
ticketSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.ticketNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const count = await mongoose.model('Ticket').countDocuments();
      this.ticketNumber = `BT${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
      console.log(`Generated ticket number: ${this.ticketNumber}`);
    }
    next();
  } catch (error) {
    console.error('Error generating ticket number:', error);
    next(error);
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
