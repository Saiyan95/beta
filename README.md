# Beta Technology Egypt - Support Ticket System

A comprehensive support ticket system for Beta Technology Egypt that manages client support requests for software and hardware solutions.

## Features

- Multi-role authentication (Admin, Technical Team, Clients)
- Ticket management system
- Real-time chat between technical team and clients
- Software and hardware support tracking
- Warranty checking system
- Ticket status tracking and history
- Admin dashboard for complete system oversight

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Real-time Chat: Socket.io

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Set up environment variables
4. Start the development servers:
   ```bash
   # Start backend
   cd backend && npm run dev
   
   # Start frontend (in a new terminal)
   cd frontend && npm start
   ```

## Environment Variables

Create `.env` files in both backend and frontend directories with the following variables:

### Backend
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Frontend
```
REACT_APP_API_URL=http://localhost:5000
```
#   b e t a  
 #   b e t a  
 #   b e t a  
 