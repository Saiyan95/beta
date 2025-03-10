import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Get all tickets
      const tickets = await Ticket.find().populate('client').populate('assignedTo');
      console.log(`\nFound ${tickets.length} tickets in database.\n`);
      
      // Analyze each ticket
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        console.log(`----- TICKET #${i+1} -----`);
        console.log(`ID: ${ticket._id}`);
        console.log(`Ticket Number: ${ticket.ticketNumber || 'N/A'}`);
        console.log(`Status: ${ticket.status}`);
        console.log(`Priority: ${ticket.priority}`);
        console.log(`Category: ${ticket.category || 'MISSING CATEGORY'}`);
        
        // Check product info
        if (ticket.product) {
          console.log(`Product Name: ${ticket.product.name || 'MISSING NAME'}`);
          console.log(`Product Type/Version: ${ticket.product.type || ticket.product.version || 'MISSING TYPE/VERSION'}`);
        } else {
          console.log(`Product: MISSING PRODUCT INFORMATION`);
        }
        
        // Check client info
        if (ticket.client) {
          console.log(`Client ID: ${ticket.client._id}`);
          console.log(`Client Name: ${ticket.client.firstName} ${ticket.client.lastName}`);
          console.log(`Client Company: ${ticket.client.companyName || 'MISSING COMPANY'}`);
        } else {
          console.log(`Client: MISSING CLIENT`);
        }
        
        // Check clientDetails
        if (ticket.clientDetails && Object.keys(ticket.clientDetails).length > 0) {
          console.log(`Client Details:`);
          console.log(`  Name: ${ticket.clientDetails.firstName} ${ticket.clientDetails.lastName}`);
          console.log(`  Company: ${ticket.clientDetails.companyName || 'MISSING COMPANY'}`);
          console.log(`  Department: ${ticket.clientDetails.department || 'MISSING DEPARTMENT'}`);
        } else {
          console.log(`Client Details: MISSING OR EMPTY`);
        }
        
        // Check assigned user
        if (ticket.assignedTo) {
          console.log(`Assigned To: ${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`);
        } else {
          console.log(`Assigned To: UNASSIGNED`);
        }
        
        console.log('------------------\n');
      }
      
      // Disconnect from MongoDB
      mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Error verifying tickets:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
