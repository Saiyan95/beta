import { io } from 'socket.io-client';
import { SOCKET_URL } from './apiConfig';

let socket = null;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  if (!token) {
    console.error('No token provided for socket connection');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: true,
    autoConnect: true,
    path: '/socket.io/',
    withCredentials: true
  });

  socket.on('connect', () => {
    console.log('Socket connection established to:', SOCKET_URL);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    if (error.message.includes('Invalid namespace')) {
      console.error('Invalid namespace error - check socket server configuration');
    }
    if (error.message.includes('Authentication error')) {
      console.error('Authentication error - check token validity');
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect' || reason === 'transport close') {
      // Server initiated disconnect or transport issue, try to reconnect
      setTimeout(() => {
        if (!socket.connected) {
          console.log('Attempting to reconnect socket...');
          socket.connect();
        }
      }, 1000);
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { socket }; 