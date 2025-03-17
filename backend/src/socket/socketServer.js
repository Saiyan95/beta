import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { socketAuth } from '../middleware/auth.js';

dotenv.config();

let io;

export const initSocket = (server) => {
  // Get the frontend URL from environment variables or use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  console.log(`Initializing Socket.IO with CORS origin: ${frontendUrl}`);
  
  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost ports
        if (origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        
        // Allow specific production domains
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:3004',
          'http://localhost:5000',
          'http://localhost:5001',
          'http://localhost:5002'
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        console.log('Socket.IO CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    path: '/socket.io/',
    connectTimeout: 20000,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    allowUpgrades: true,
    maxHttpBufferSize: 1e8,
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Use the socket authentication middleware
  io.use(socketAuth);

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}, Role: ${socket.user.role}`);
    
    // Set up ping/pong to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle transport errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.userId}:`, error);
    });

    // Join user's personal room for notifications
    socket.on('joinUserRoom', (userId) => {
      if (socket.user.userId === userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal room`);
      } else {
        console.log(`User ${socket.user.userId} attempted to join room for ${userId} - denied`);
      }
    });

    // Join technician room
    socket.on('joinTechnicianRoom', () => {
      if (socket.user.role === 'technician' || socket.user.role === 'admin') {
        socket.join('technicians');
        console.log(`Technician ${socket.user.userId} joined technicians room`);
      } else {
        console.log(`User ${socket.user.userId} attempted to join technicians room but is not a technician`);
      }
    });

    // Leave technician room
    socket.on('leaveTechnicianRoom', () => {
      socket.leave('technicians');
      console.log(`Technician ${socket.user.userId} left technicians room`);
    });

    // Join ticket room
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`User ${socket.user.userId} joined ticket room: ${ticketId}`);
    });

    // Leave ticket room
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`User ${socket.user.userId} left ticket room: ${ticketId}`);
    });

    // Handle ticket messages
    socket.on('ticket_message', (data) => {
      console.log(`Received message for ticket ${data.ticketId} from user ${socket.user.userId}:`, data);
      io.to(`ticket_${data.ticketId}`).emit('new_message', {
        ...data,
        sender: {
          _id: socket.user.userId,
          name: socket.user.name || 'User',
          role: socket.user.role
        },
        timestamp: new Date()
      });
      console.log(`Message sent to ticket room: ${data.ticketId}`);
    });

    // Handle ticket acceptance
    socket.on('accept_ticket', (data) => {
      console.log(`Ticket ${data.ticketId} acceptance request from ${socket.user.userId}:`, data);
      
      // Notify the client
      io.to(`user_${data.clientId}`).emit('ticket_accepted', {
        ticketId: data.ticketId,
        technicianId: socket.user.userId,
        technicianName: socket.user.name || 'Technician'
      });

      // Notify all technicians
      io.to('technicians').emit('ticket_assigned', {
        ticketId: data.ticketId,
        technicianId: socket.user.userId,
        technicianName: socket.user.name || 'Technician'
      });

      // Notify the ticket room
      io.to(`ticket_${data.ticketId}`).emit('ticket_updated', {
        _id: data.ticketId,
        assignedTo: {
          _id: socket.user.userId,
          name: socket.user.name || 'Technician'
        },
        status: 'in_progress'
      });

      console.log(`Ticket ${data.ticketId} accepted by technician ${socket.user.userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('Socket.io not initialized yet, returning null');
    return null; // Return null instead of throwing an error
  }
  return io;
};

// Helper function to emit new ticket notification
export const emitNewTicket = (ticketData) => {
  if (!io) {
    console.warn('Socket.io not initialized, skipping emitNewTicket');
    return;
  }
  
  console.log('Emitting new_ticket event to technicians:', ticketData);
  io.to('technicians').emit('new_ticket', ticketData);
};

// Helper function to emit ticket assignment notification
export const emitTicketAssigned = (assignmentData) => {
  if (!io) {
    console.warn('Socket.io not initialized, skipping emitTicketAssigned');
    return;
  }
  
  console.log('Emitting ticket assignment notifications:', assignmentData);
  
  // Notify the client
  io.to(`user_${assignmentData.clientId}`).emit('ticket_accepted', {
    ticketId: assignmentData.ticketId,
    technicianId: assignmentData.technicianId,
    technicianName: assignmentData.technicianName
  });
  
  // Notify all technicians
  io.to('technicians').emit('ticket_assigned', assignmentData);
  
  // Notify the assigned technician specifically
  io.to(`user_${assignmentData.technicianId}`).emit('ticket_assigned_to_you', {
    ticketId: assignmentData.ticketId,
    ticketNumber: assignmentData.ticketNumber,
    clientId: assignmentData.clientId,
    clientName: assignmentData.clientName
  });
};

// Helper function to emit new message notification
export const emitNewMessage = (messageData) => {
  if (!io) {
    console.warn('Socket.io not initialized, skipping emitNewMessage');
    return;
  }
  
  console.log('Emitting new message notification:', messageData);
  io.to(`user_${messageData.recipientId}`).emit('new_message_notification', messageData);
  io.to(`ticket_${messageData.ticketId}`).emit('new_message', messageData);
};
