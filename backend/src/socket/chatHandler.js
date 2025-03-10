import jwt from 'jsonwebtoken';
import Ticket from '../models/Ticket.js';

export const setupSocketHandlers = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.userId);

    // Join ticket room
    socket.on('join_ticket', async (ticketId) => {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          socket.emit('error', 'Ticket not found');
          return;
        }

        // Check if user has access to this ticket
        const canAccess = 
          socket.user.role === 'admin' ||
          (socket.user.role === 'client' && ticket.client.toString() === socket.user.userId) ||
          (socket.user.role === 'technical' && ticket.assignedTo?.toString() === socket.user.userId);

        if (!canAccess) {
          socket.emit('error', 'Access denied');
          return;
        }

        socket.join(`ticket_${ticketId}`);
        console.log(`User ${socket.user.userId} joined ticket ${ticketId}`);
      } catch (error) {
        console.error('Error joining ticket room:', error);
        socket.emit('error', 'Failed to join ticket room');
      }
    });

    // Leave ticket room
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`User ${socket.user.userId} left ticket ${ticketId}`);
    });

    // Handle new message
    socket.on('ticket_message', async (data) => {
      try {
        const { ticketId, message } = data;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
          socket.emit('error', 'Ticket not found');
          return;
        }

        // Check if user has access to this ticket
        const canAccess = 
          socket.user.role === 'admin' ||
          (socket.user.role === 'client' && ticket.client.toString() === socket.user.userId) ||
          (socket.user.role === 'technical' && ticket.assignedTo?.toString() === socket.user.userId);

        if (!canAccess) {
          socket.emit('error', 'Access denied');
          return;
        }

        // Add message to ticket
        ticket.messages.push({
          sender: socket.user.userId,
          content: message,
          timestamp: new Date()
        });
        await ticket.save();

        // Broadcast message to all users in the ticket room
        io.to(`ticket_${ticketId}`).emit('message_received', {
          sender: socket.user,
          content: message,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error handling ticket message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle typing status
    socket.on('typing_start', (ticketId) => {
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        userId: socket.user.userId,
        typing: true
      });
    });

    socket.on('typing_end', (ticketId) => {
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        userId: socket.user.userId,
        typing: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.userId);
    });
  });
};
