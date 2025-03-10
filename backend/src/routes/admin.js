import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import {
  getStats,
  getTickets,
  getTicketHistory,
  getTechnicians,
  assignTicket,
  getClients,
  getClient,
  getClientTickets
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(verifyToken, checkRole(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create a new user (admin creation)
router.post('/users', async (req, res) => {
  try {
    console.log('Received user creation request:', req.body);
    
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      role,
      phoneNumber,
      specialization,
      companyName,
      department
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: `User already exists with ${existingUser.email === email ? 'this email' : 'this username'}` 
      });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      role: role || 'client',
      phoneNumber,
      ...(role === 'technician' && { specialization }),
      ...(role === 'client' && { companyName, department })
    });

    await newUser.save();
    console.log('User created successfully:', newUser._id);

    // Return the created user without password
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Get all technicians
router.get('/technicians', async (req, res) => {
  try {
    console.log('Fetching technicians');
    const technicians = await User.find({ role: 'technician' }).select('-password');
    res.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Error fetching technicians' });
  }
});

// Get dashboard stats for admin
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching admin stats');
    // Count tickets by status and priority
    const [totalTickets, openTickets, urgentTickets, totalUsers, totalTechnicians, totalClients] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $ne: 'resolved' } }),
      Ticket.countDocuments({ priority: 'urgent' }),
      User.countDocuments(),
      User.countDocuments({ role: 'technician' }),
      User.countDocuments({ role: 'client' })
    ]);

    // Get resolved tickets today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = await Ticket.countDocuments({
      status: 'resolved',
      updatedAt: { $gte: today }
    });

    res.json({
      totalTickets,
      openTickets,
      urgentTickets,
      totalUsers,
      totalTechnicians,
      totalClients,
      resolvedToday
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get all admin tickets
router.get('/tickets', async (req, res) => {
  try {
    console.log('Fetching all tickets for admin');
    const tickets = await Ticket.find()
      .populate('createdBy', 'username firstName lastName email')
      .populate('assignedTo', 'username firstName lastName specialization')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

// Get all tickets for admin
router.get('/tickets/history', getTicketHistory);
router.post('/tickets/:ticketId/assign', assignTicket);

// Get all clients
router.get('/clients', getClients);
router.get('/clients/:clientId', getClient);
router.get('/clients/:clientId/tickets', getClientTickets);

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    console.log('Updating user:', req.params.id);
    console.log('Update data:', req.body);
    
    const {
      firstName,
      lastName, 
      email,
      username,
      password,
      role,
      phoneNumber,
      specialization,
      companyName,
      department
    } = req.body;
    
    // Create update object
    const updateData = {
      firstName,
      lastName,
      email,
      username,
      role,
      phoneNumber,
      ...(role === 'technician' && { specialization }),
      ...(role === 'client' && { companyName, department })
    };
    
    // Only update password if provided
    if (password) {
      // We'll need to hash the password before updating
      // The User model's pre-save middleware won't run for findByIdAndUpdate
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.password = password; // This will trigger the hashing in the User model
      await user.save();
      
      // Then update the rest of the fields
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select('-password');
      
      res.json(updatedUser);
    } else {
      // Update without changing password
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    console.log('Deleting user:', req.params.id);
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user's tickets if they're a client
    if (user.role === 'client') {
      await Ticket.deleteMany({ client: user._id });
    }
    
    // Unassign tickets if they're a technician
    if (user.role === 'technician') {
      await Ticket.updateMany(
        { assignedTo: user._id },
        { $unset: { assignedTo: 1 }, status: 'new' }
      );
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

export default router;
