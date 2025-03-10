# Beta Technology Egypt Support Ticket System - Getting Started Guide

## System Overview

The Beta Technology Egypt Support Ticket System is a comprehensive solution for managing support tickets between clients and technicians. The system consists of two main components:

1. **Backend Server**: A Node.js/Express application that handles API requests, authentication, and real-time communication via Socket.io.
2. **Frontend Application**: A React.js application that provides a user interface for interacting with the system.

## Current Status

- **Backend Server**: Running on port 5002 and connected to MongoDB
- **Frontend Application**: Currently not running due to execution policy restrictions

## Testing Tools

To help you test the system without running the full frontend application, we've created several testing tools:

1. **API Tester (Command Line)**: `api-test.js` - A Node.js script that allows you to test the API endpoints from the command line.
2. **Socket.io Tester (Command Line)**: `socket-test.js` - A Node.js script that allows you to test the Socket.io functionality from the command line.
3. **API Tester (Browser)**: `test-api.html` - An HTML file that you can open in your browser to test the API endpoints.
4. **Socket.io Tester (Browser)**: `test-socket.html` - An HTML file that you can open in your browser to test the Socket.io functionality.

## Using the Testing Tools

### Command Line API Tester

To use the command line API tester:

1. Open a command prompt or PowerShell window
2. Navigate to the project directory
3. Run `node api-test.js`
4. Follow the on-screen menu to test different API endpoints

### Command Line Socket.io Tester

To use the command line Socket.io tester:

1. Open a command prompt or PowerShell window
2. Navigate to the project directory
3. Run `node socket-test.js`
4. Follow the on-screen menu to test different Socket.io functionality

### Browser-based Testers

To use the browser-based testers:

1. Navigate to the project directory in File Explorer
2. Right-click on `test-api.html` or `test-socket.html`
3. Select "Open with" and choose your preferred web browser
4. Use the interface to test the API endpoints or Socket.io functionality

## Starting the Full System

### Starting the Backend Server

The backend server is already running on port 5002. If you need to restart it:

1. Open a command prompt or PowerShell window
2. Navigate to the backend directory: `cd backend`
3. Install dependencies (if needed): `npm install`
4. Start the server: `npm start`

### Starting the Frontend Application

To start the frontend application, you'll need to bypass the PowerShell execution policy restrictions. Here are a few options:

#### Option 1: Using Command Prompt

1. Open a Command Prompt window (not PowerShell)
2. Navigate to the frontend directory: `cd frontend`
3. Start the application: `npm start`

#### Option 2: Temporarily Bypass PowerShell Execution Policy

1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
3. Navigate to the frontend directory: `cd frontend`
4. Start the application: `npm start`

#### Option 3: Using the Batch File

1. Double-click the `start-frontend.bat` file in the project directory

## System Features

### Authentication

- User registration (client and technician)
- User login
- JWT-based authentication
- Role-based access control

### Ticket Management

- Create tickets (clients only)
- View tickets (filtered by role)
- Update ticket status (technicians and admin)
- Assign tickets to technicians (admin only)

### Real-time Communication

- Chat functionality for tickets
- Real-time notifications for new tickets and ticket assignments
- Technician room for broadcasting new tickets

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

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - If port 5002 is already in use, update the `.env` file in the backend directory to use a different port
   - If port 3000 is already in use, set the `PORT` environment variable to a different value before starting the frontend

2. **PowerShell Execution Policy**
   - If you encounter execution policy errors, try using Command Prompt instead of PowerShell
   - Alternatively, temporarily bypass the execution policy as described above

3. **MongoDB Connection Issues**
   - Ensure MongoDB is running on your system
   - Check the connection string in the `.env` file

### Getting Help

If you encounter any issues not covered in this guide, please refer to the system documentation or contact the development team for assistance.
