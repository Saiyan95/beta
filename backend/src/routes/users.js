// Update your existing userRoutes.js file by importing the notification routes
import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Find user by username
router.get('/find', verifyToken, async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`Finding user with username: ${username}`);
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: `User with username ${username} not found` });
    }
    
    console.log(`Found user: ${user.username} with ID: ${user._id}`);
    res.json(user);
  } catch (error) {
    console.error('Error finding user by username:', error);
    res.status(500).json({ message: 'Error finding user' });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email, phone },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Get all users
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all technicians (for admin and clients)
router.get('/technicians', verifyToken, async (req, res) => {
  try {
    console.log('Fetching technicians');
    const technicians = await User.find({ role: 'technician' })
      .select('_id username firstName lastName specialization activeTickets');
    
    console.log(`Found ${technicians.length} technicians:`);
    technicians.forEach(tech => {
      console.log(`- ${tech._id}: ${tech.firstName} ${tech.lastName} (${tech.username})`);
    });
    
    res.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Error fetching technicians' });
  }
});

// ===================== NOTIFICATION ROUTES =====================

/**
 * Get all notifications for the current user
 * GET /api/users/notifications
 */
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    // Get user ID from the token
    const userId = req.user.userId;
    
    // Fetch notifications, sorted by most recent first
    const notifications = await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to recent 50 notifications for performance
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

/**
 * Mark a notification as read
 * PATCH /api/users/notifications/:id/read
 */
router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;
    
    // Update notification, ensuring it belongs to the current user
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

/**
 * Mark all notifications as read for the current user
 * PATCH /api/users/notifications/read-all
 */
router.patch('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

/**
 * Delete a notification
 * DELETE /api/users/notifications/:id
 */
router.delete('/notifications/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;
    
    // Delete notification, ensuring it belongs to the current user
    const result = await Notification.findOneAndDelete({ 
      _id: notificationId, 
      userId 
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification removed' });
  } catch (error) {
    console.error('Error removing notification:', error);
    res.status(500).json({ message: 'Error removing notification' });
  }
});

export default router;