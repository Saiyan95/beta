# Beta Technology Egypt Support Ticket System - System Overview

## System Architecture

### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based
- **Real-time Communication**: Socket.io

### Frontend
- **Framework**: React.js
- **UI Library**: Material-UI

## Key Components

### Authentication System
- JWT-based authentication with role-based access control
- Three user roles: Client, Technical Team, Admin
- Enhanced security with token verification and expiration

### Ticket Management
- Creation, assignment, processing, and resolution of tickets
- Status tracking and history management
- Priority levels: Low, Medium, High, Urgent
- Categories: Software, Hardware, Network

### Real-time Communication
- Socket.io for instant messaging between clients and technicians
- Room-based communication for ticket-specific discussions
- Real-time notifications for ticket updates

## System Flow

### User Registration and Authentication
1. Users register as clients or technicians
2. System validates credentials and issues JWT tokens
3. Tokens are used for subsequent API requests

### Ticket Lifecycle
1. Client creates a ticket with product details and issue description
2. Admin assigns ticket to appropriate technician
3. Technician works on the ticket and updates status
4. Client and technician communicate in real-time via chat
5. Ticket is resolved and closed

### Socket.io Communication
1. Users connect to Socket.io server on login
2. Technicians join the 'technicians' room
3. Users join specific ticket rooms when viewing tickets
4. Real-time messages and notifications are sent through these rooms

## API Endpoints

### Authentication
- `POST /api/auth/client/signup`: Register a new client
- `POST /api/auth/client/login`: Login as client
- `POST /api/auth/technician/signup`: Register a new technician
- `POST /api/auth/technician/login`: Login as technician
- `GET /api/auth/profile`: Get user profile

### Tickets
- `POST /api/tickets`: Create a new ticket (clients only)
- `GET /api/tickets`: Get all tickets (filtered by role)
- `GET /api/tickets/:id`: Get a specific ticket
- `PATCH /api/tickets/:id/status`: Update ticket status (admin and technical)
- `POST /api/tickets/:id/assign`: Assign ticket to technician (admin only)
- `POST /api/tickets/:id/messages`: Add a message to a ticket
- `GET /api/tickets/:id/messages`: Get all messages for a ticket

### Users
- `GET /api/users/profile`: Get user profile
- `PATCH /api/users/profile`: Update user profile
- `GET /api/users/technicians`: Get all technicians

## Socket.io Events

### Client to Server
- `joinTechnicianRoom`: Join the technicians room
- `leaveTechnicianRoom`: Leave the technicians room
- `join_ticket`: Join a specific ticket room
- `ticket_message`: Send a message to a ticket room

### Server to Client
- `message_received`: Receive a message in a ticket room
- `newTicket`: Notification of a new ticket
- `ticketAssigned`: Notification of ticket assignment

## Recent Improvements

1. **Enhanced Socket.io Implementation**
   - Centralized Socket.io initialization
   - Improved event handling and error logging
   - Shared socket service for frontend components

2. **Improved Authentication**
   - Better token verification and validation
   - Enhanced role-based access control
   - Resource ownership verification

3. **Error Handling**
   - Consistent error responses across all endpoints
   - Detailed error logging for debugging
   - User-friendly error messages

4. **Code Organization**
   - Modular structure for better maintainability
   - Separation of concerns between components
   - Reusable utility functions

## Getting Started

### Starting the Backend
```bash
cd backend
npm install
npm start
```

### Starting the Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables

#### Backend (.env)
```
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/beta_tech_support
JWT_SECRET=beta_tech_support_secret_key_2025
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5002
REACT_APP_SOCKET_URL=http://localhost:5002
```

## Testing the System

You can test the system using the provided `test-api.html` file, which allows you to interact with the API endpoints directly from your browser.
