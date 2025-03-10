import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Find existing admin users
      const existingAdmin = await User.findOne({ role: 'admin' });
      const existingBetaTechAdmin = await User.findOne({ email: 'admin@beta-tech.com' });
      
      if (existingBetaTechAdmin) {
        // Update just the password of the existing beta-tech admin
        console.log('Found existing admin@beta-tech.com user');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        existingBetaTechAdmin.password = hashedPassword;
        existingBetaTechAdmin.role = 'admin'; // Ensure it has admin role
        
        await existingBetaTechAdmin.save();
        console.log('Admin password updated successfully!');
        
        // If there was a different admin, remove their admin privileges
        if (existingAdmin && existingAdmin.email !== 'admin@beta-tech.com') {
          console.log('Removing admin privileges from previous admin:', existingAdmin.email);
          await User.deleteOne({ _id: existingAdmin._id });
        }
      } else if (existingAdmin) {
        console.log('Found existing admin user:', existingAdmin._id);
        console.log('Current email:', existingAdmin.email);
        
        // Update admin credentials
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        existingAdmin.email = 'admin@beta-tech.com';
        existingAdmin.password = hashedPassword;
        
        await existingAdmin.save();
        console.log('Admin credentials updated successfully!');
      } else {
        // Create new admin if none exists
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const newAdmin = new User({
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@beta-tech.com',
          password: hashedPassword,
          role: 'admin'
        });
        
        await newAdmin.save();
        console.log('New admin user created:', newAdmin._id);
      }
      
      console.log('\n==========================================');
      console.log('UPDATED ADMIN CREDENTIALS');
      console.log('==========================================');
      console.log('Email: admin@beta-tech.com');
      console.log('Password: admin123');
      console.log('==========================================');
      
      mongoose.connection.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
