import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

dotenv.config();

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support';
console.log(`Connecting to MongoDB at: ${mongoUrl}`);

mongoose.connect(mongoUrl)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Clear existing data
      console.log('Clearing existing data...');
      await Ticket.deleteMany({});
      await User.deleteMany({});
      console.log('All users and tickets deleted.');
      
      // Create admin user
      console.log('Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@beta-tech.com',
        password: adminPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created:', adminUser._id);
      
      // Create tech user
      console.log('Creating tech user...');
      const techPassword = await bcrypt.hash('tech123', salt);
      
      const techUser = new User({
        username: 'techsupport',
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@beta-tech.com',
        password: techPassword,
        role: 'technical',
        specialty: ['Hardware', 'Software', 'Networking']
      });
      
      await techUser.save();
      console.log('Tech user created:', techUser._id);
      
      // Create client user
      console.log('Creating client user...');
      const clientPassword = await bcrypt.hash('client123', salt);
      
      const clientUser = new User({
        username: 'client',
        firstName: 'David',
        lastName: 'Johnson',
        email: 'client@beta-tech.com',
        password: clientPassword,
        role: 'client',
        companyName: 'Cloud Technologies',
        department: 'IT',
        phoneNumber: '(555) 123-4567'
      });
      
      await clientUser.save();
      console.log('Client user created:', clientUser._id);
      
      // Create tickets
      console.log('Creating sample tickets...');
      
      const ticketData = [
        {
          ticketNumber: 'TK-00001',
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
            serialNumber: 'BT-12345'
          },
          title: 'Database Connection Issue',
          description: 'Unable to connect to the database server',
          createdAt: new Date()
        },
        {
          ticketNumber: 'TK-00002',
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
            serialNumber: 'BT-67890'
          },
          title: 'Server Overheating',
          description: 'Server temperature is reaching critical levels',
          createdAt: new Date()
        },
        {
          ticketNumber: 'TK-00003',
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
            serialNumber: 'BT-54321'
          },
          title: 'Account Lockout',
          description: 'Users unable to log in after password reset',
          createdAt: new Date()
        }
      ];
      
      for (const data of ticketData) {
        const ticket = new Ticket(data);
        await ticket.save();
      }
      
      console.log('Sample tickets created');
      
      // Generate fresh token
      const token = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('\n==========================================');
      console.log('DATABASE RESET COMPLETE');
      console.log('==========================================');
      console.log('Admin user created with login:');
      console.log('Email: admin@beta-tech.com');
      console.log('Password: admin123');
      console.log('\nFresh JWT token:');
      console.log(token);
      console.log('\nUse this in localStorage:');
      console.log(`localStorage.setItem('token', '${token}');`);
      console.log(`localStorage.setItem('user', '${JSON.stringify({
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }).replace(/"/g, '\\"')}');`);
      console.log('==========================================');
      
      // Update the LoginBypass file with this token
      console.log('\nUpdate your LoginBypass.js with this token to fix login issues.');
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
