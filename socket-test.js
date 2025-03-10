// Command-line tool to test the Beta Tech Support Socket.io functionality
const { io } = require('socket.io-client');
const readline = require('readline');

const SOCKET_URL = 'http://localhost:5002';
let socket = null;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to Socket.io server
function connect() {
  console.log(`Connecting to Socket.io server at ${SOCKET_URL}...`);
  
  socket = io(SOCKET_URL);
  
  // Connection events
  socket.on('connect', () => {
    console.log(`Connected to Socket.io server with ID: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.io server');
  });
  
  socket.on('connect_error', (error) => {
    console.error(`Connection error: ${error.message}`);
  });
  
  // Listen for ticket events
  socket.on('newTicket', (data) => {
    console.log('\n[EVENT] New ticket received:', data);
  });
  
  socket.on('ticketAssigned', (data) => {
    console.log('\n[EVENT] Ticket assigned:', data);
  });
  
  socket.on('message_received', (data) => {
    console.log('\n[EVENT] Message received:', data);
  });
}

// Disconnect from Socket.io server
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Disconnected from Socket.io server');
  } else {
    console.log('Not connected to any server');
  }
}

// Join technician room
function joinTechnicianRoom() {
  if (!socket) {
    console.log('Not connected to any server');
    return;
  }
  
  socket.emit('joinTechnicianRoom');
  console.log('Joined technician room');
}

// Leave technician room
function leaveTechnicianRoom() {
  if (!socket) {
    console.log('Not connected to any server');
    return;
  }
  
  socket.emit('leaveTechnicianRoom');
  console.log('Left technician room');
}

// Join ticket room
function joinTicketRoom(ticketId) {
  if (!socket) {
    console.log('Not connected to any server');
    return;
  }
  
  socket.emit('join_ticket', ticketId);
  console.log(`Joined ticket room: ${ticketId}`);
}

// Send message to ticket room
function sendTicketMessage(ticketId, message) {
  if (!socket) {
    console.log('Not connected to any server');
    return;
  }
  
  const data = {
    ticketId,
    message,
    sender: socket.id,
    timestamp: new Date().toISOString()
  };
  
  socket.emit('ticket_message', data);
  console.log(`Sent message to ticket ${ticketId}: ${message}`);
}

// Main menu
function showMenu() {
  console.log('\n=== Beta Tech Support Socket.io Tester ===');
  console.log('1. Connect to Socket.io server');
  console.log('2. Disconnect from Socket.io server');
  console.log('3. Join technician room');
  console.log('4. Leave technician room');
  console.log('5. Join ticket room');
  console.log('6. Send message to ticket room');
  console.log('0. Exit');
  
  rl.question('\nSelect an option: ', (answer) => {
    switch (answer) {
      case '1':
        connect();
        break;
      case '2':
        disconnect();
        break;
      case '3':
        joinTechnicianRoom();
        break;
      case '4':
        leaveTechnicianRoom();
        break;
      case '5':
        rl.question('Enter ticket ID: ', (ticketId) => {
          joinTicketRoom(ticketId);
          showMenu();
        });
        return;
      case '6':
        rl.question('Enter ticket ID: ', (ticketId) => {
          rl.question('Enter message: ', (message) => {
            sendTicketMessage(ticketId, message);
            showMenu();
          });
        });
        return;
      case '0':
        console.log('Exiting...');
        if (socket) {
          socket.disconnect();
        }
        rl.close();
        return;
      default:
        console.log('Invalid option');
    }
    
    showMenu();
  });
}

// Start the application
console.log('Starting Beta Tech Support Socket.io Tester...');
console.log(`Socket.io URL: ${SOCKET_URL}`);
showMenu();
