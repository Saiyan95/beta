import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Create admin user
      let adminUser = await User.findOne({ email: 'admin@beta-tech.com' });
      
      if (!adminUser) {
        console.log('Creating admin user...');
        // Generate hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        adminUser = new User({
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@beta-tech.com',
          password: hashedPassword,
          role: 'admin'
        });
        
        await adminUser.save();
        console.log('Admin user created:', adminUser._id);
      } else {
        console.log('Admin user already exists:', adminUser._id);
      }
      
      // Create technical user
      let techUser = await User.findOne({ email: 'tech@beta-tech.com' });
      
      if (!techUser) {
        console.log('Creating tech user...');
        // Generate hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('tech123', salt);
        
        techUser = new User({
          username: 'techsupport',
          firstName: 'Tech',
          lastName: 'Support',
          email: 'tech@beta-tech.com',
          password: hashedPassword,
          role: 'technical',
          specialization: ['Hardware', 'Software', 'Networking']
        });
        
        await techUser.save();
        console.log('Tech user created:', techUser._id);
      } else {
        console.log('Tech user already exists:', techUser._id);
      }
      
      // Create client user
      let clientUser = await User.findOne({ email: 'client@beta-tech.com' });
      
      if (!clientUser) {
        console.log('Creating client user...');
        // Generate hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('client123', salt);
        
        clientUser = new User({
          username: 'client',
          firstName: 'David',
          lastName: 'Johnson',
          email: 'client@beta-tech.com',
          password: hashedPassword,
          role: 'client',
          companyName: 'Cloud Technologies',
          department: 'IT',
          phoneNumber: '(555) 123-4567'
        });
        
        await clientUser.save();
        console.log('Client user created:', clientUser._id);
      } else {
        console.log('Client user already exists:', clientUser._id);
        
        // Update client user if needed
        if (!clientUser.companyName || !clientUser.department) {
          clientUser.companyName = 'Cloud Technologies';
          clientUser.department = 'IT';
          clientUser.phoneNumber = '(555) 123-4567';
          await clientUser.save();
          console.log('Client user updated with missing fields');
        }
      }
      
      // Create sample tickets if none exist
      const ticketCount = await Ticket.countDocuments();
      
      if (ticketCount === 0) {
        console.log('Creating sample tickets...');
        
        // Create 3 sample tickets
        const tickets = [
          {
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
            status: 'new',
            priority: 'high',
            category: 'Software',
            product: {
              name: 'Cloud Database',
              type: 'SQL Database',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            },
            title: 'Database Connection Issue',
            description: 'Unable to connect to the database server',
            createdAt: new Date()
          },
          {
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
            assignedTo: techUser._id,
            status: 'in_progress',
            priority: 'urgent',
            category: 'Hardware',
            product: {
              name: 'Cloud Server',
              type: 'Physical Server',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            },
            title: 'Server Overheating',
            description: 'Server temperature is reaching critical levels',
            createdAt: new Date()
          },
          {
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
            status: 'on_hold',
            priority: 'medium',
            category: 'Security',
            product: {
              name: 'Cloud Authentication',
              type: 'Identity Service',
              serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
            },
            title: 'Account Lockout',
            description: 'Users unable to log in after password reset',
            createdAt: new Date()
          }
        ];
        
        for (const ticketData of tickets) {
          const ticket = new Ticket(ticketData);
          await ticket.save();
          console.log('Ticket created:', ticket._id);
        }
      } else {
        console.log(`Found ${ticketCount} existing tickets - skipping ticket creation`);
      }
      
      // Generate JWT token for admin
      const token = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('\n==========================================');
      console.log('ADMIN LOGIN CREDENTIALS');
      console.log('==========================================');
      console.log('Email: admin@beta-tech.com');
      console.log('Password: admin123');
      console.log('==========================================');
      console.log('\nADMIN JWT TOKEN (for direct API testing):');
      console.log(token);
      console.log('\n==========================================');
      console.log('USER DATA FOR localStorage:');
      console.log('==========================================');
      console.log(`localStorage.setItem('token', '${token}');`);
      console.log(`localStorage.setItem('user', '${JSON.stringify({
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }).replace(/"/g, '\\"')}');`);
      console.log('==========================================\n');
      
      // Disconnect from MongoDB
      mongoose.connection.close();
      console.log('Done! Database populated with admin user and sample tickets.');
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
