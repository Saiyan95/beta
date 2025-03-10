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
      // Create client users if they don't exist
      const clientsData = [
        {
          username: 'client1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          password: 'password123',
          role: 'client',
          companyName: 'Acme Corp',
          department: 'IT',
          phoneNumber: '(555) 123-4567'
        },
        {
          username: 'client2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          password: 'password123',
          role: 'client',
          companyName: 'XYZ Industries',
          department: 'Marketing',
          phoneNumber: '(555) 987-6543'
        }
      ];

      // Create technical user if it doesn't exist
      const techData = {
        username: 'techuser',
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@beta-tech.com',
        password: 'tech123',
        role: 'technical',
        specialization: ['Hardware', 'Software', 'Networking']
      };

      let clients = [];
      let tech = null;

      // Create or find clients
      for (const clientData of clientsData) {
        let client = await User.findOne({ email: clientData.email });
        if (!client) {
          console.log(`Creating client: ${clientData.email}`);
          client = new User(clientData);
          await client.save();
        }
        clients.push(client);
      }

      // Create or find tech user
      tech = await User.findOne({ email: techData.email });
      if (!tech) {
        console.log(`Creating tech user: ${techData.email}`);
        tech = new User(techData);
        await tech.save();
      }

      // Create sample tickets
      const ticketsData = [
        {
          client: clients[0]._id,
          clientDetails: {
            firstName: clients[0].firstName,
            lastName: clients[0].lastName,
            companyName: clients[0].companyName,
            username: clients[0].username,
            department: clients[0].department,
            phoneNumber: clients[0].phoneNumber
          },
          status: 'new',
          priority: 'high',
          category: 'Software',
          product: {
            name: 'Office Suite Pro',
            type: 'Software'
          },
          description: 'Unable to open documents after recent update. Error message says "File format not supported".',
          numberOfUsers: 5
        },
        {
          client: clients[0]._id,
          clientDetails: {
            firstName: clients[0].firstName,
            lastName: clients[0].lastName,
            companyName: clients[0].companyName,
            username: clients[0].username,
            department: clients[0].department,
            phoneNumber: clients[0].phoneNumber
          },
          assignedTo: tech._id,
          status: 'in_progress',
          priority: 'urgent',
          category: 'Hardware',
          product: {
            name: 'WorkStation X1',
            serialNumber: 'WS-2023-89421',
            warrantyStatus: {
              inWarranty: true,
              expiryDate: new Date('2026-12-31')
            }
          },
          description: 'Computer won\'t boot. Power light comes on but nothing appears on screen.',
          numberOfUsers: 1,
          messages: [
            {
              sender: clients[0]._id,
              content: 'I\'ve tried restarting multiple times but nothing happens.',
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
            },
            {
              sender: tech._id,
              content: 'Have you tried connecting an external monitor to see if it\'s a display issue?',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            },
            {
              sender: clients[0]._id,
              content: 'Yes, I tried that but still no display output.',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
            }
          ],
          history: [
            {
              action: 'Ticket created',
              performedBy: clients[0]._id,
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
            },
            {
              action: 'Ticket assigned to Tech Support',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000) // 36 hours ago
            },
            {
              action: 'Status changed to in_progress',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000) // 36 hours ago
            }
          ]
        },
        {
          client: clients[1]._id,
          clientDetails: {
            firstName: clients[1].firstName,
            lastName: clients[1].lastName,
            companyName: clients[1].companyName,
            username: clients[1].username,
            department: clients[1].department,
            phoneNumber: clients[1].phoneNumber
          },
          status: 'new',
          priority: 'medium',
          category: 'Network',
          product: {
            name: 'Corporate VPN',
            type: 'Software'
          },
          description: 'Unable to connect to VPN from home office. Was working last week but now fails with "Connection timeout" error.',
          numberOfUsers: 1
        },
        {
          client: clients[1]._id,
          clientDetails: {
            firstName: clients[1].firstName,
            lastName: clients[1].lastName,
            companyName: clients[1].companyName,
            username: clients[1].username,
            department: clients[1].department,
            phoneNumber: clients[1].phoneNumber
          },
          assignedTo: tech._id,
          status: 'resolved',
          priority: 'low',
          category: 'Software',
          product: {
            name: 'Email Client',
            type: 'Software'
          },
          description: 'Need help setting up email signature with company logo.',
          numberOfUsers: 1,
          messages: [
            {
              sender: clients[1]._id,
              content: 'I tried following the instructions in the help docs but the image isn\'t displaying correctly.',
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            },
            {
              sender: tech._id,
              content: 'Please make sure the image is no larger than 300x100 pixels and is in JPG or PNG format.',
              timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
            },
            {
              sender: clients[1]._id,
              content: 'That worked! Thank you for your help.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            }
          ],
          history: [
            {
              action: 'Ticket created',
              performedBy: clients[1]._id,
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            },
            {
              action: 'Ticket assigned to Tech Support',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000) // 6.5 days ago
            },
            {
              action: 'Status changed to in_progress',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000) // 6.5 days ago
            },
            {
              action: 'Status changed to resolved',
              performedBy: tech._id,
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            }
          ]
        },
        {
          client: clients[0]._id,
          clientDetails: {
            firstName: clients[0].firstName,
            lastName: clients[0].lastName,
            companyName: clients[0].companyName,
            username: clients[0].username,
            department: clients[0].department,
            phoneNumber: clients[0].phoneNumber
          },
          status: 'new',
          priority: 'critical',
          category: 'Security',
          product: {
            name: 'Corporate Database',
            type: 'Software'
          },
          description: 'Suspicious login attempts detected from unknown IP addresses. Possible security breach.',
          numberOfUsers: 50
        }
      ];

      // Create tickets
      let createdTickets = 0;
      for (let i = 0; i < ticketsData.length; i++) {
        const ticketData = ticketsData[i];
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
          const ticketNumber = `BT${year}${month}-${(ticketCount + i + 1).toString().padStart(4, '0')}`;
          
          const ticket = new Ticket({
            ...ticketData,
            ticketNumber: ticketNumber
          });
          
          await ticket.save();
          createdTickets++;
        }
      }

      console.log(`Created ${createdTickets} new tickets`);
      console.log('Sample data created successfully!');
      console.log('\nClient Login Credentials:');
      for (const client of clientsData) {
        console.log(`- Email: ${client.email}, Password: ${client.password}`);
      }
      console.log('\nTechnician Login Credentials:');
      console.log(`- Email: ${techData.email}, Password: ${techData.password}`);
      console.log('\nAdmin Login Credentials:');
      console.log('- Email: admin@beta-tech.com, Password: admin123');

    } catch (error) {
      console.error('Error creating sample data:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
