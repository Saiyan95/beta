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
      // Remove existing admin user
      await User.deleteOne({ email: 'admin@beta-tech.com' });
      console.log('Existing admin user removed');

      // Create new admin user
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
      console.log('Email: admin@beta-tech.com');
      console.log('Password: admin123');
      console.log('\nJWT Token:');
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
