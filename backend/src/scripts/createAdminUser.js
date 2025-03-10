import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Admin user credentials
const adminUser = {
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@beta-tech.com',
  password: 'admin123',  // This will be hashed before saving
  role: 'admin'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email: adminUser.email });
      
      if (existingAdmin) {
        console.log('Admin user already exists. Updating password...');
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);
        
        // Update only the password
        await User.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword });
        
        console.log('Admin password updated successfully!');
      } else {
        // Create a new admin user
        const newAdmin = new User(adminUser);
        await newAdmin.save();
        
        console.log('Admin user created successfully!');
      }
      
      // Print login credentials
      console.log('\nAdmin Login Credentials:');
      console.log('Email:', adminUser.email);
      console.log('Password:', adminUser.password);
    } catch (error) {
      console.error('Error creating/updating admin user:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
