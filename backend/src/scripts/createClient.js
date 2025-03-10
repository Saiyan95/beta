import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Create client user
      const clientData = {
        username: 'haamalashry',
        firstName: 'Haam',
        lastName: 'Alashry',
        email: 'haamalashry@gmail.com',
        password: 'password123',
        role: 'client',
        companyName: 'Beta Tech',
        department: 'IT',
        phoneNumber: '123-456-7890'
      };

      let client = await User.findOne({ email: clientData.email });
      if (!client) {
        console.log(`Creating client: ${clientData.email}`);
        client = new User(clientData);
        await client.save();
        console.log('Client created successfully!');
        console.log('Email:', clientData.email);
        console.log('Password:', clientData.password);
      } else {
        console.log('Client already exists:');
        console.log('Email:', client.email);
        console.log('Password: Use "password123" if this is a new installation');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTimeout(() => {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }, 2000);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err)); 