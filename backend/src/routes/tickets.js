import express from 'express';
import { verifyToken, checkRole, checkOwnership } from '../middleware/auth.js';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addMessage,
  getTicketMessages,
  getTicketStats,
  submitReview
} from '../controllers/ticketController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create ticket (clients only)
router.post('/', checkRole(['client']), createTicket);

// Get all tickets (filtered by role)
router.get('/', getTickets);

// Get ticket statistics
router.get('/stats', getTicketStats);

// Get specific ticket
router.get('/:id', getTicketById);

// Update ticket status (admin and technician)
router.patch('/:id/status', checkRole(['admin', 'technician']), updateTicketStatus);

// Assign ticket to technician (admin and technicians can self-assign)
router.patch('/:id/assign', checkRole(['admin', 'technician']), assignTicket);

// Message routes - anyone can add messages to tickets they have access to
router.post('/:id/messages', addMessage);
router.get('/:id/messages', getTicketMessages);

// Submit ticket review (client only)
router.post('/:id/review', checkRole(['client']), submitReview);

export default router;
