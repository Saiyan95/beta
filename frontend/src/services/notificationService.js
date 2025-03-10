import Notification from '../models/Notification.js';

/**
 * Service for creating and managing notifications
 */
export const NotificationService = {
  /**
   * Create a new ticket notification for technicians
   * @param {Object} ticketData - The ticket data
   * @param {Array} recipientIds - Array of user IDs to receive the notification
   */
  createNewTicketNotification: async (ticketData, recipientIds) => {
    try {
      const notifications = recipientIds.map(userId => ({
        userId,
        type: 'new_ticket',
        ticketId: ticketData.ticketId,
        ticketNumber: ticketData.ticketNumber,
        message: `New ticket #${ticketData.ticketNumber} created by ${ticketData.client?.name || 'Client'}`,
        read: false
      }));
      
      await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating new ticket notifications:', error);
    }
  },

  /**
   * Create a ticket update notification
   * @param {Object} ticketData - The ticket data
   * @param {Array} recipientIds - Array of user IDs to receive the notification
   */
  createTicketUpdateNotification: async (ticketData, recipientIds) => {
    try {
      const notifications = recipientIds.map(userId => ({
        userId,
        type: 'ticket_update',
        ticketId: ticketData.ticketId,
        ticketNumber: ticketData.ticketNumber,
        message: `Ticket #${ticketData.ticketNumber} has been updated: ${ticketData.updateType}`,
        read: false
      }));
      
      await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating ticket update notifications:', error);
    }
  },

  /**
   * Create a new message notification
   * @param {Object} messageData - The message data
   * @param {Array} recipientIds - Array of user IDs to receive the notification (excluding sender)
   */
  createNewMessageNotification: async (messageData, recipientIds) => {
    try {
      const notifications = recipientIds.map(userId => {
        // Don't create notification for the sender
        if (userId === messageData.sender?.id) return null;
        
        return {
          userId,
          type: 'new_message',
          ticketId: messageData.ticketId,
          ticketNumber: messageData.ticketNumber,
          message: `New message from ${messageData.sender?.name || 'User'} on ticket #${messageData.ticketNumber}`,
          read: false
        };
      }).filter(Boolean); // Filter out null values (sender)
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error('Error creating new message notifications:', error);
    }
  },

  /**
   * Create a ticket assigned notification
   * @param {Object} ticketData - The ticket data
   * @param {String} technicianId - ID of the technician assigned to the ticket
   */
  createTicketAssignedNotification: async (ticketData, technicianId) => {
    try {
      await Notification.create({
        userId: technicianId,
        type: 'ticket_assigned',
        ticketId: ticketData.ticketId,
        ticketNumber: ticketData.ticketNumber,
        message: `Ticket #${ticketData.ticketNumber} has been assigned to you`,
        read: false
      });
    } catch (error) {
      console.error('Error creating ticket assigned notification:', error);
    }
  },

  /**
   * Create a ticket accepted notification for the client
   * @param {Object} ticketData - The ticket data
   * @param {String} clientId - ID of the client who owns the ticket
   */
  createTicketAcceptedNotification: async (ticketData, clientId) => {
    try {
      await Notification.create({
        userId: clientId,
        type: 'ticket_accepted',
        ticketId: ticketData.ticketId,
        ticketNumber: ticketData.ticketNumber,
        message: `Your ticket #${ticketData.ticketNumber} has been accepted by ${ticketData.technicianName}`,
        read: false
      });
    } catch (error) {
      console.error('Error creating ticket accepted notification:', error);
    }
  },

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Number} - Count of unread notifications
   */
  getUnreadCount: async (userId) => {
    try {
      return await Notification.countDocuments({ userId, read: false });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  },

  /**
   * Delete old notifications (e.g., older than 30 days)
   * This could be run as a scheduled task
   */
  deleteOldNotifications: async (daysToKeep = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await Notification.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      console.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }
};

export default NotificationService;