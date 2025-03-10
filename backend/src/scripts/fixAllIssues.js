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
      // 1. Ensure admin user exists
      let adminUser = await User.findOne({ email: 'admin@beta-tech.com' });
      if (!adminUser) {
        console.log('Creating admin user...');
        adminUser = new User({
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@beta-tech.com',
          password: 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }

      // 2. Ensure tech user exists
      let techUser = await User.findOne({ email: 'tech@beta-tech.com' });
      if (!techUser) {
        console.log('Creating tech user...');
        techUser = new User({
          username: 'techsupport',
          firstName: 'Tech',
          lastName: 'Support',
          email: 'tech@beta-tech.com',
          password: 'tech123',
          role: 'technical',
          specialization: ['Hardware', 'Software', 'Networking']
        });
        await techUser.save();
      } else {
        console.log('Tech user already exists:', techUser.email);
      }

      // 3. Ensure cloud client exists
      let cloudClient = await User.findOne({ email: 'david@cloud.com' });
      if (!cloudClient) {
        console.log('Creating cloud client...');
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
      } else {
        console.log('Cloud client already exists:', cloudClient.email);
      }

      // 4. Remove all existing tickets
      console.log('Removing all existing tickets...');
      await Ticket.deleteMany({});

      // 5. Create new tickets with complete details
      const ticketsData = [
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
          assignedTo: techUser._id, // Assign to tech user
          status: 'in_progress',
          priority: 'high',
          category: 'Software',
          product: {
            name: 'Cloud Database',
            type: 'SQL Database'
          },
          description: 'Database connection issues after recent migration',
          numberOfUsers: 15,
          messages: [
            {
              sender: cloudClient._id,
              content: 'Our users are experiencing intermittent connection issues to the database',
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
            },
            {
              sender: techUser._id,
              content: 'We\'re investigating the connection pool settings. Will update soon.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          ],
          history: [
            {
              action: 'Ticket created',
              performedBy: cloudClient._id,
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
            },
            {
              action: 'Assigned to Tech Support',
              performedBy: adminUser._id,
              timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000) // 47 hours ago
            },
            {
              action: 'Status changed to in_progress',
              performedBy: techUser._id,
              timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000) // 46 hours ago
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
          priority: 'urgent',
          category: 'Hardware',
          product: {
            name: 'Cloud Server',
            type: 'Physical Server',
            serialNumber: 'CS-2023-12345',
            warrantyStatus: {
              inWarranty: true,
              expiryDate: new Date('2026-06-30')
            }
          },
          description: 'Main cloud server experiencing intermittent outages affecting all customer services',
          numberOfUsers: 50
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
          assignedTo: techUser._id, // Assign to tech user
          status: 'on_hold',
          priority: 'medium',
          category: 'Security',
          product: {
            name: 'Cloud Authentication',
            type: 'Identity Service'
          },
          description: 'Need to implement two-factor authentication for all cloud service administrators',
          numberOfUsers: 5,
          history: [
            {
              action: 'Ticket created',
              performedBy: cloudClient._id,
              timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) // 72 hours ago
            },
            {
              action: 'Assigned to Tech Support',
              performedBy: adminUser._id,
              timestamp: new Date(Date.now() - 70 * 60 * 60 * 1000) // 70 hours ago
            },
            {
              action: 'Status changed to on_hold',
              performedBy: techUser._id,
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
            }
          ]
        }
      ];

      // Create the tickets
      for (let i = 0; i < ticketsData.length; i++) {
        const ticketData = ticketsData[i];
        
        // Generate a ticket number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const ticketCount = i + 1;
        const ticketNumber = `CL${year}${month}-${ticketCount.toString().padStart(4, '0')}`;
        
        const ticket = new Ticket({
          ...ticketData,
          ticketNumber
        });
        
        await ticket.save();
        console.log(`Created ticket: ${ticketNumber}`);
      }

      console.log('\nAll issues fixed successfully!');
      console.log(`Created ${ticketsData.length} tickets for Cloud Technologies`);
      console.log('\nAvailable Login Credentials:');
      console.log(`Admin: ${adminUser.email} / admin123`);
      console.log(`Client: ${cloudClient.email} / cloud123`);
      console.log(`Tech: ${techUser.email} / tech123`);
      
      mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Error fixing issues:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
