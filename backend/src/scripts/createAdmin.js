import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Username:', existingAdmin.username);
      console.log('Password: (Use "admin123" if this is a new installation)');
      return existingAdmin;
    }
    
    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@betatech.com',
      password: 'admin123', // Will be hashed by the User model's pre-save middleware
      firstName: 'Admin',  
      lastName: 'User',    
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@betatech.com');
    console.log('Password: admin123');
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Disconnect from MongoDB after 2 seconds to allow time for the save operation
    setTimeout(() => {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }, 2000);
  }
}

// Run the function
createAdminUser();
