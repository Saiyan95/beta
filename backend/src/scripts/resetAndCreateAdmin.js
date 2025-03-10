import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

// Admin credentials - for script use only
const ADMIN_EMAIL = 'admin@beta-tech.com';
const ADMIN_PASSWORD = 'admin123';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // First, find all admin users and revoke their admin status
      const adminUsers = await User.find({ role: 'admin' });
      console.log(`Found ${adminUsers.length} admin users`);
      
      // Delete all existing admin users to clean the slate
      if (adminUsers.length > 0) {
        await User.deleteMany({ role: 'admin' });
        console.log('All existing admin users deleted');
      }
      
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      const newAdmin = new User({
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });
      
      await newAdmin.save();
      
      console.log('\n==========================================');
      console.log('NEW ADMIN CREATED SUCCESSFULLY!');
      console.log('==========================================');
      console.log(`Admin ID: ${newAdmin._id}`);
      console.log('==========================================');
      
      // Also create a tech user if one doesn't exist
      const techUsers = await User.find({ role: 'technical' });
      if (techUsers.length === 0) {
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
        console.log('Technical support user created');
      }
      
      mongoose.connection.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error creating admin:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
