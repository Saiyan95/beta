import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/apiConfig';

let socket = null;
let socketListeners = [];
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Get or initialize the socket connection
 * @param {string} token - Authentication token
 * @returns {Socket} The socket instance
 */
export const getSocket = (token) => {
  if (!socket) {
    // Create new socket connection
    socket = io(SOCKET_URL, {
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      auth: { token: token || localStorage.getItem('token') }
    });
    
    console.log('Socket connection established to:', SOCKET_URL);
    
    // Setup socket event handlers
    setupSocketEventHandlers();
    
    // Apply any registered listeners
    socketListeners.forEach(({ event, callback }) => {
      socket.on(event, callback);
    });
  }
  return socket;
};

/**
 * Setup socket event handlers for connection events
 */
const setupSocketEventHandlers = () => {
  if (!socket) return;
  
  socket.on('connect', () => {
    console.log('Socket connected successfully');
    reconnectAttempts = 0;
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Please check your connection.');
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // The server has forcefully disconnected the socket
      console.log('Server disconnected the socket. Attempting to reconnect...');
      socket.connect();
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

/**
 * Register an event listener that persists across reconnections
 * @param {string} event - The event name
 * @param {function} callback - The callback function
 */
export const onSocketEvent = (event, callback) => {
  // Store the listener for reconnections
  socketListeners.push({ event, callback });
  
  // If socket exists, add the listener immediately
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove a specific event listener
 * @param {string} event - The event name
 * @param {function} callback - The callback function to remove
 */
export const offSocketEvent = (event, callback) => {
  // Remove from our tracking array
  socketListeners = socketListeners.filter(
    listener => !(listener.event === event && listener.callback === callback)
  );
  
  // Remove from socket if it exists
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Close the socket connection
 */
export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketListeners = [];
    reconnectAttempts = 0;
    console.log('Socket connection closed');
  }
};

/**
 * Join a user's personal room for notifications
 * @param {string} userId - The user ID to join
 */
export const joinUserRoom = (userId) => {
  try {
    const socket = getSocket();
    socket.emit('joinUserRoom', userId);
  } catch (error) {
    console.error('Error joining user room:', error);
  }
};

/**
 * Join a ticket room
 * @param {string} ticketId - The ticket ID to join
 */
export const joinTicketRoom = (ticketId) => {
  try {
    const socket = getSocket();
    socket.emit('join_ticket', ticketId);
  } catch (error) {
    console.error('Error joining ticket room:', error);
  }
};

/**
 * Leave a ticket room
 * @param {string} ticketId - The ticket ID to leave
 */
export const leaveTicketRoom = (ticketId) => {
  try {
    const socket = getSocket();
    socket.emit('leave_ticket', ticketId);
  } catch (error) {
    console.error('Error leaving ticket room:', error);
  }
};

/**
 * Join the technician room
 */
export const joinTechnicianRoom = () => {
  try {
    const socket = getSocket();
    socket.emit('joinTechnicianRoom');
  } catch (error) {
    console.error('Error joining technician room:', error);
  }
};

/**
 * Leave the technician room
 */
export const leaveTechnicianRoom = () => {
  try {
    const socket = getSocket();
    socket.emit('leaveTechnicianRoom');
  } catch (error) {
    console.error('Error leaving technician room:', error);
  }
};

/**
 * Send a message to a ticket room
 * @param {Object} data - The message data
 * @returns {Promise} - Resolves when message is sent or rejects on error
 */
export const sendTicketMessage = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const socket = getSocket();
      socket.emit('ticket_message', data);
      resolve();
    } catch (error) {
      console.error('Error sending ticket message:', error);
      reject(error);
    }
  });
};

/**
 * Accept a ticket as a technician
 * @param {Object} data - The ticket acceptance data
 * @returns {Promise} - Resolves when ticket is accepted or rejects on error
 */
export const acceptTicket = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const socket = getSocket();
      socket.emit('accept_ticket', data);
      resolve();
    } catch (error) {
      console.error('Error accepting ticket:', error);
      reject(error);
    }
  });
};

/**
 * Check if socket is connected
 * @returns {boolean} - True if socket is connected, false otherwise
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Reconnect the socket if disconnected
 * @param {string} token - Authentication token
 */
export const reconnectSocket = (token) => {
  if (socket && !socket.connected) {
    socket.connect();
  } else if (!socket) {
    getSocket(token);
  }
};
