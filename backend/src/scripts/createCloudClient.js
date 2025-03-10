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
      // Clear previous test data
      console.log('Removing previous sample tickets...');
      await Ticket.deleteMany({
        $or: [
          { 'clientDetails.companyName': 'Acme Corp' },
          { 'clientDetails.companyName': 'XYZ Industries' }
        ]
      });
      
      console.log('Removing previous sample users...');
      await User.deleteMany({
        $or: [
          { email: 'john.smith@example.com' },
          { email: 'sarah.johnson@example.com' }
        ]
      });
      
      // Create Cloud company client user
      const cloudClientData = {
        username: 'cloudclient',
        firstName: 'David',
        lastName: 'Johnson',
        email: 'david@cloud.com',
        password: 'cloud123',
        role: 'client',
        companyName: 'Cloud Technologies',
        department: 'IT',
        phoneNumber: '(555) 789-1234'
      };

      // Check if Cloud client already exists
      let cloudClient = await User.findOne({ email: cloudClientData.email });
      if (!cloudClient) {
        console.log(`Creating Cloud client: ${cloudClientData.email}`);
        cloudClient = new User(cloudClientData);
        await cloudClient.save();
      } else {
        console.log('Cloud client already exists, using existing client');
      }

      // Create or find tech user
      const techData = {
        username: 'techsupport',
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@beta-tech.com',
        password: 'tech123',
        role: 'technical',
        specialization: ['Hardware', 'Software', 'Networking']
      };

      let tech = await User.findOne({ email: techData.email });
      if (!tech) {
        console.log(`Creating tech user: ${techData.email}`);
        tech = new User(techData);
        await tech.save();
      } else {
        console.log('Tech user already exists, using existing tech');
      }

      // Create tickets for Cloud Technologies
      const cloudTicketsData = [
        {
          client: cloudClient._id,
          clientDetails: {
            firstName: cloudClient.firstName,
            lastName: cloudClient.lastName,
            companyName: cloudClient.companyName,
            username: cloudClient.username,
            department: cloudClient.department,
            phoneNumber: cloudClient.phoneNumber
          },
          status: 'new',
          priority: 'high',
          category: 'Software',
          product: {
            name: 'Cloud Database',
            type: 'Software'
          },
          description: 'Database connection issues after recent migration. Users unable to access cloud storage.',
          numberOfUsers: 15
        },
        {
          client: cloudClient._id,
          clientDetails: {
            firstName: cloudClient.firstName,
            lastName: cloudClient.lastName,
            companyName: cloudClient.companyName,
            username: cloudClient.username,
            department: cloudClient.department,
            phoneNumber: cloudClient.phoneNumber
          },
          assignedTo: tech._id,
          status: 'in_progress',
          priority: 'urgent',
          category: 'Hardware',
          product: {
            name: 'Cloud Server',
            serialNumber: 'CS-2023-12345',
            warrantyStatus: {
              inWarranty: true,
              expiryDate: new Date('2026-06-30')
            }
          },
          description: 'Main cloud server experiencing intermittent outages affecting all customer services.',
          numberOfUsers: 50,
          messages: [
            {
              sender: cloudClient._id,
              content: 'This is severely impacting our business operations. Please prioritize.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            },
            {
              sender: tech._id,
              content: 'We\'ve identified a hardware issue with the primary cooling system. Working on a fix.',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
            }
          ],
          history: [
            {
              action: 'Ticket created',
              performedBy: cloudClient._id,
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            },
            {
              action: 'Ticket assigned to Tech Support',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 hours ago
            },
            {
              action: 'Status changed to in_progress',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 hours ago
            }
          ]
        },
        {
          client: cloudClient._id,
          clientDetails: {
            firstName: cloudClient.firstName,
            lastName: cloudClient.lastName,
            companyName: cloudClient.companyName,
            username: cloudClient.username,
            department: cloudClient.department,
            phoneNumber: cloudClient.phoneNumber
          },
          status: 'new',
          priority: 'medium',
          category: 'Security',
          product: {
            name: 'Cloud Authentication',
            type: 'Software'
          },
          description: 'Need to implement two-factor authentication for all cloud service administrators.',
          numberOfUsers: 5
        }
      ];

      // Create tickets
      let createdTickets = 0;
      for (let i = 0; i < cloudTicketsData.length; i++) {
        const ticketData = cloudTicketsData[i];
        // Check if similar ticket already exists
        const existingTicket = await Ticket.findOne({
          client: ticketData.client,
          'product.name': ticketData.product.name,
          description: ticketData.description
        });
        
        if (!existingTicket) {
          // Generate a ticket number manually
          const date = new Date();
          const year = date.getFullYear().toString().substr(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const ticketCount = await Ticket.countDocuments();
          const ticketNumber = `CL${year}${month}-${(ticketCount + i + 1).toString().padStart(4, '0')}`;
          
          const ticket = new Ticket({
            ...ticketData,
            ticketNumber: ticketNumber
          });
          
          await ticket.save();
          createdTickets++;
        }
      }

      console.log(`Created ${createdTickets} new tickets for Cloud Technologies`);
      console.log('Cloud client data created successfully!');
      console.log('\nCloud Client Login Credentials:');
      console.log(`- Email: ${cloudClientData.email}, Password: ${cloudClientData.password}`);
      console.log('\nTechnician Login Credentials:');
      console.log(`- Email: ${techData.email}, Password: ${techData.password}`);
      console.log('\nAdmin Login Credentials:');
      console.log('- Email: admin@beta-tech.com, Password: admin123');

    } catch (error) {
      console.error('Error creating Cloud client data:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
