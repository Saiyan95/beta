import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getSocket, 
  onSocketEvent, 
  offSocketEvent, 
  joinUserRoom,
  joinTechnicianRoom
} from '../services/socketService';
import { API_URL, USER_ENDPOINTS } from '../utils/apiConfig';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/users/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.filter(notif => !notif.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Initialize socket connection
    const socket = getSocket();

    // Join user's personal room for notifications
    if (user.userId) {
      joinUserRoom(user.userId);
    }

    // If user is a technician, join the technician room
    if (user.role === 'technician' || user.role === 'admin') {
      joinTechnicianRoom();
    }

    // Handle new ticket notifications
    const handleNewTicket = (data) => {
      const newNotification = {
        id: `ticket_${Date.now()}`,
        type: 'new_ticket',
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        message: `New ticket #${data.ticketNumber} created by ${data.client?.name || 'Client'}`,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle ticket update notifications
    const handleTicketUpdate = (data) => {
      const newNotification = {
        id: `update_${Date.now()}`,
        type: 'ticket_update',
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        message: `Ticket #${data.ticketNumber} has been updated: ${data.updateType}`,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle new message notifications
    const handleNewMessage = (data) => {
      // Only create notification if message is from someone else
      if (data.sender?.id !== user.userId) {
        const newNotification = {
          id: `message_${Date.now()}`,
          type: 'new_message',
          ticketId: data.ticketId,
          ticketNumber: data.ticketNumber,
          message: `New message from ${data.sender?.name || 'User'} on ticket #${data.ticketNumber}`,
          timestamp: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    // Handle ticket assignment notifications
    const handleTicketAssigned = (data) => {
      const newNotification = {
        id: `assigned_${Date.now()}`,
        type: 'ticket_assigned',
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        message: `Ticket #${data.ticketNumber} has been assigned to you`,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Handle ticket acceptance notifications for clients
    const handleTicketAccepted = (data) => {
      const newNotification = {
        id: `accepted_${Date.now()}`,
        type: 'ticket_accepted',
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        message: `Your ticket #${data.ticketNumber} has been accepted by ${data.technicianName}`,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Register event listeners
    onSocketEvent('new_ticket', handleNewTicket);
    onSocketEvent('ticket_updated', handleTicketUpdate);
    onSocketEvent('new_message', handleNewMessage);
    onSocketEvent('ticket_assigned', handleTicketAssigned);
    onSocketEvent('ticket_accepted', handleTicketAccepted);

    // Cleanup function
    return () => {
      offSocketEvent('new_ticket', handleNewTicket);
      offSocketEvent('ticket_updated', handleTicketUpdate);
      offSocketEvent('new_message', handleNewMessage);
      offSocketEvent('ticket_assigned', handleTicketAssigned);
      offSocketEvent('ticket_accepted', handleTicketAccepted);
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Remove a notification
  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
