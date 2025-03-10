import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Remove all existing tickets first
      console.log('Removing all existing tickets...');
      await Ticket.deleteMany({});
      
      // Find the Cloud client or create one if it doesn't exist
      let cloudClient = await User.findOne({ email: 'david@cloud.com' });
      
      if (!cloudClient) {
        console.log('Creating Cloud client user...');
        cloudClient = new User({
          username: 'cloudclient',
          firstName: 'David',
          lastName: 'Johnson',
          email: 'david@cloud.com',
          password: 'cloud123',
          role: 'client',
          companyName: 'Cloud Technologies',
          department: 'IT Support',
          phoneNumber: '(555) 789-1234'
        });
        await cloudClient.save();
      }
      
      console.log('Client found/created:', cloudClient.firstName, cloudClient.lastName);
      
      // Find tech user or create one
      let tech = await User.findOne({ email: 'tech@beta-tech.com' });
      if (!tech) {
        console.log('Creating tech user...');
        tech = new User({
          username: 'techsupport',
          firstName: 'Tech',
          lastName: 'Support',
          email: 'tech@beta-tech.com',
          password: 'tech123',
          role: 'technical',
          specialization: ['Hardware', 'Software', 'Networking']
        });
        await tech.save();
      }
      
      // Create new tickets with explicit client details
      const ticketsToCreate = [
        {
          status: 'new',
          priority: 'high',
          category: 'Software',
          product: {
            name: 'Cloud Database',
            type: 'Database Management System'
          },
          description: 'Database connection issues after recent cloud migration',
          numberOfUsers: 15
        },
        {
          status: 'in_progress',
          priority: 'urgent',
          category: 'Hardware',
          assignedTo: tech._id,
          product: {
            name: 'Cloud Server',
            serialNumber: 'CS-2023-12345',
            warrantyStatus: {
              inWarranty: true,
              expiryDate: new Date('2026-06-30')
            },
            type: 'Server Hardware'
          },
          description: 'Main cloud server experiencing intermittent outages',
          numberOfUsers: 50
        },
        {
          status: 'new',
          priority: 'medium',
          category: 'Security',
          product: {
            name: 'Cloud Authentication',
            type: 'Identity Management'
          },
          description: 'Need to implement two-factor authentication for cloud admins',
          numberOfUsers: 5
        }
      ];
      
      // Create the tickets with proper client information
      for (let i = 0; i < ticketsToCreate.length; i++) {
        const ticketData = ticketsToCreate[i];
        
        // Generate a ticket number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const ticketCount = i + 1;
        const ticketNumber = `CL${year}${month}-${ticketCount.toString().padStart(4, '0')}`;
        
        // Create the ticket with explicit client details
        const ticket = new Ticket({
          ticketNumber,
          client: cloudClient._id,
          clientDetails: {
            firstName: cloudClient.firstName,
            lastName: cloudClient.lastName,
            companyName: cloudClient.companyName,
            username: cloudClient.username,
            department: cloudClient.department,
            phoneNumber: cloudClient.phoneNumber
          },
          ...ticketData
        });
        
        await ticket.save();
        console.log(`Created ticket: ${ticketNumber}`);
      }
      
      console.log('Fixed all tickets successfully!');
      console.log(`Created ${ticketsToCreate.length} tickets for Cloud Technologies`);
      console.log('\nLogin credentials:');
      console.log(`Client: ${cloudClient.email} / cloud123`);
      console.log(`Tech: ${tech.email} / tech123`);
      console.log('Admin: admin@beta-tech.com / admin123');
      
    } catch (error) {
      console.error('Error fixing tickets:', error);
    } finally {
      mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
