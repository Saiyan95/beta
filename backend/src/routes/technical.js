import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require authentication and technician role
router.use(verifyToken, checkRole(['technician']));

// Get technician's tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ 
      assignedTo: mongoose.Types.ObjectId(req.user.userId)
    })
      .populate('client', 'firstName lastName username companyName department phoneNumber')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching technician tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

// Get technician's stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      { 
        $match: { 
          assignedTo: mongoose.Types.ObjectId(req.user.userId)
        } 
      },
      {
        $group: {
          _id: null,
          assignedTickets: { $sum: 1 },
          resolvedTickets: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
            } 
          },
          inProgressTickets: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] 
            } 
          },
          pendingTickets: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'new'] }, 1, 0] 
            } 
          }
        }
      }
    ]);

    const defaultStats = {
      assignedTickets: 0,
      resolvedTickets: 0,
      inProgressTickets: 0,
      pendingTickets: 0
    };

    res.json(stats[0] || defaultStats);
  } catch (error) {
    console.error('Error fetching technician stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Update ticket status
router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const ticket = await Ticket.findOne({ 
      _id: req.params.id,
      assignedTo: req.user.userId 
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or not assigned to you' });
    }

    ticket.status = status;
    if (notes) {
      ticket.notes = notes;
    }
    ticket.history.push({
      action: `Status updated to ${status}`,
      performedBy: req.user.userId,
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName username companyName department phoneNumber')
      .populate('assignedTo', 'firstName lastName username');

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Error updating ticket status' });
  }
});

export default router; 