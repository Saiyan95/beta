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
      // 1. Find all tickets
      const tickets = await Ticket.find().populate('client');
      console.log(`Found ${tickets.length} tickets in the database`);
      
      if (tickets.length === 0) {
        console.log('No tickets to update. Creating a sample ticket...');
        
        // Find a client user to assign the ticket to
        const clientUser = await User.findOne({ role: 'client' });
        
        if (!clientUser) {
          console.log('No client users found. Creating a test client...');
          const newClient = new User({
            username: 'testclient',
            firstName: 'Test',
            lastName: 'Client',
            email: 'client@example.com',
            password: 'password123',
            role: 'client',
            companyName: 'Test Company',
            department: 'IT',
            phoneNumber: '(555) 123-4567'
          });
          await newClient.save();
          console.log('Created test client:', newClient._id);
          
          // Create a new ticket
          const newTicket = new Ticket({
            ticketNumber: 'TK-' + Math.floor(10000 + Math.random() * 90000),
            client: newClient._id,
            clientDetails: {
              firstName: newClient.firstName,
              lastName: newClient.lastName,
              companyName: newClient.companyName,
              username: newClient.username,
              department: newClient.department,
              phoneNumber: newClient.phoneNumber
            },
            status: 'open',
            priority: 'medium',
            category: 'Software',
            product: {
              name: 'Beta CRM',
              version: '1.0',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            },
            title: 'Test Ticket',
            description: 'This is a test ticket created by the fix script',
            createdAt: new Date()
          });
          await newTicket.save();
          console.log('Created test ticket:', newTicket._id);
        } else {
          // Create a new ticket with the existing client
          const newTicket = new Ticket({
            ticketNumber: 'TK-' + Math.floor(10000 + Math.random() * 90000),
            client: clientUser._id,
            clientDetails: {
              firstName: clientUser.firstName,
              lastName: clientUser.lastName,
              companyName: clientUser.companyName,
              username: clientUser.username,
              department: clientUser.department,
              phoneNumber: clientUser.phoneNumber
            },
            status: 'open',
            priority: 'medium',
            category: 'Software',
            product: {
              name: 'Beta CRM',
              version: '1.0',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            },
            title: 'Sample Ticket',
            description: 'This is a sample ticket created by the fix script',
            createdAt: new Date()
          });
          await newTicket.save();
          console.log('Created sample ticket with existing client:', newTicket._id);
        }
      } else {
        // Update existing tickets with client details
        console.log('Updating existing tickets with client details...');
        
        let updatedCount = 0;
        for (const ticket of tickets) {
          // Skip tickets that don't have a client
          if (!ticket.client) {
            console.log(`Ticket ${ticket._id} has no client, skipping...`);
            continue;
          }
          
          // Get full client details
          const clientId = ticket.client._id || ticket.client;
          const client = await User.findById(clientId);
          
          if (!client) {
            console.log(`Client ${clientId} not found for ticket ${ticket._id}, skipping...`);
            continue;
          }
          
          // Update clientDetails field
          ticket.clientDetails = {
            firstName: client.firstName,
            lastName: client.lastName,
            companyName: client.companyName,
            username: client.username,
            department: client.department,
            phoneNumber: client.phoneNumber
          };
          
          // Add product details if missing
          if (!ticket.product || !ticket.product.name) {
            ticket.product = {
              name: 'Beta Software Suite',
              version: '2.0',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            };
          }
          
          // Add category if missing
          if (!ticket.category) {
            ticket.category = 'Software';
          }
          
          // Save the updated ticket
          await ticket.save();
          updatedCount++;
        }
        
        console.log(`Updated ${updatedCount} tickets with client details`);
      }
      
      // Disconnect from database
      mongoose.connection.close();
      console.log('Fixed all tickets successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error fixing tickets:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
