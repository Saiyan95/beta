import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Delete all existing users 
      await User.deleteMany({});
      console.log('All users removed');

      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('123456', salt);

      const adminUser = new User({
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('New admin user created:', adminUser._id);

      // Generate JWT token
      const token = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log('\n==========================================');
      console.log('NEW ADMIN LOGIN CREDENTIALS');
      console.log('==========================================');
      console.log('Email: admin@example.com');
      console.log('Password: 123456');
      console.log('\nJWT Token:');
      console.log(token);
      console.log('\nUSE THESE IN YOUR BROWSER CONSOLE:');
      console.log(`localStorage.setItem('token', '${token}');`);
      console.log(`localStorage.setItem('user', '${JSON.stringify({
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }).replace(/"/g, '\\"')}');`);
      console.log('==========================================');

      // Create a tech user
      const techPassword = await bcrypt.hash('123456', salt);
      const techUser = new User({
        username: 'tech',
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@example.com',
        password: techPassword,
        role: 'technical'
      });
      await techUser.save();
      console.log('Tech user created:', techUser._id);

      // Create a client user
      const clientPassword = await bcrypt.hash('123456', salt);
      const clientUser = new User({
        username: 'client',
        firstName: 'Client',
        lastName: 'User',
        email: 'client@example.com',
        password: clientPassword,
        role: 'client',
        companyName: 'Test Company',
        department: 'IT',
        phoneNumber: '555-1234'
      });
      await clientUser.save();
      console.log('Client user created:', clientUser._id);

      mongoose.connection.close();
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
