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
      // Remove existing tech user if it exists
      await User.deleteOne({ email: 'tech@beta-tech.com' });
      console.log('Removed existing tech@beta-tech.com user if existed');

      // Create new tech user with specific credentials
      const salt = await bcrypt.genSalt(10);
      const techPassword = await bcrypt.hash('tech123', salt);

      const techUser = new User({
        username: 'techsupport',
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@beta-tech.com',
        password: techPassword,
        role: 'technical',
        specialization: ['Hardware', 'Software', 'Networking']
      });

      await techUser.save();
      console.log('New tech user created with ID:', techUser._id);

      console.log('\n==========================================');
      console.log('TECHNICAL SUPPORT LOGIN CREDENTIALS');
      console.log('==========================================');
      console.log('Email: tech@beta-tech.com');
      console.log('Password: tech123');
      console.log('==========================================');

      mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Error creating tech user:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 