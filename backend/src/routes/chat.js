import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

// Get chat history for a ticket
router.get('/:ticketId', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== ticket.createdBy.toString() && 
        req.user._id.toString() !== ticket.assignedTo.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket.chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Send a chat message
router.post('/:ticketId', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== ticket.createdBy.toString() && 
        req.user._id.toString() !== ticket.assignedTo.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { message } = req.body;
    const chatMessage = {
      sender: req.user._id,
      content: message,
      timestamp: new Date()
    };

    // Add message to ticket's chat history
    ticket.chatHistory.push(chatMessage);
    await ticket.save();

    // Find sender and receiver
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(
      req.user._id.toString() === ticket.createdBy.toString()
        ? ticket.assignedTo
        : ticket.createdBy
    );

    // Send email notification to receiver
    if (receiver) {
      await sendEmail(
        receiver.email,
        `New message in ticket ${ticket.ticketNumber}`,
        `${sender.firstName} ${sender.lastName} sent you a message in ticket ${ticket.ticketNumber}: ${message}`,
        `
          <h2>New Message in Ticket ${ticket.ticketNumber}</h2>
          <p>${sender.firstName} ${sender.lastName} sent you a message:</p>
          <p>${message}</p>
        `
      );
    }

    // Emit socket event for real-time updates
    req.app.get('io').to(`ticket:${ticket._id}`).emit('newMessage', chatMessage);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

export default router; 