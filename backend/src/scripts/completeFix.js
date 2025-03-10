import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import jwt from 'jsonwebtoken';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // 1. Verify/create admin user
      let adminUser = await User.findOne({ email: 'admin@beta-tech.com' });
      if (!adminUser) {
        console.log('Creating admin user...');
        adminUser = new User({
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@beta-tech.com',
          password: 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      
      // 2. Verify/create tech user
      let techUser = await User.findOne({ email: 'tech@beta-tech.com' });
      if (!techUser) {
        console.log('Creating tech user...');
        techUser = new User({
          username: 'techsupport',
          firstName: 'Tech',
          lastName: 'Support',
          email: 'tech@beta-tech.com',
          password: 'tech123',
          role: 'technical',
          specialization: ['Hardware', 'Software', 'Networking']
        });
        await techUser.save();
      }

      // 3. Verify/update cloud client
      let cloudClient = await User.findOne({ email: 'david@cloud.com' });
      if (!cloudClient) {
        console.log('Creating cloud client...');
        cloudClient = new User({
          username: 'cloudclient',
          firstName: 'David',
          lastName: 'Johnson',
          email: 'david@cloud.com',
          password: 'cloud123',
          role: 'client',
          companyName: 'Cloud Technologies',
          department: 'IT',
          phoneNumber: '(555) 789-1234'
        });
        await cloudClient.save();
      } else {
        // Update existing client with all needed fields
        cloudClient.username = 'cloudclient';
        cloudClient.firstName = 'David';
        cloudClient.lastName = 'Johnson';
        cloudClient.companyName = 'Cloud Technologies';
        cloudClient.department = 'IT';
        cloudClient.phoneNumber = '(555) 789-1234';
        await cloudClient.save();
      }
      
      // 4. Create JWT tokens for easy testing
      const adminToken = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Save admin token to a file for API testing
      const tokenPath = path.resolve('../frontend/src/temp-token.txt');
      fs.writeFileSync(tokenPath, adminToken);
      console.log(`Admin token saved to ${tokenPath}`);
      
      // Save token for direct use in browser localStorage
      console.log(`\n===============================================`);
      console.log(`ADMIN TOKEN (copy to browser localStorage):\n${adminToken}`);
      console.log(`===============================================\n`);

      // 5. Verify tickets have correct data
      const tickets = await Ticket.find();
      console.log(`Found ${tickets.length} tickets in database.`);
      
      // Log user IDs for reference
      console.log(`\nUser IDs for reference:`);
      console.log(`Admin ID: ${adminUser._id}`);
      console.log(`Tech ID: ${techUser._id}`);
      console.log(`Client ID: ${cloudClient._id}\n`);
      
      // Check if first ticket needs to be updated
      if (tickets.length > 0) {
        const firstTicket = tickets[0];
        if (!firstTicket.assignedTo) {
          console.log('Updating first ticket to be assigned to tech...');
          firstTicket.assignedTo = techUser._id;
          await firstTicket.save();
        }
      }

      console.log('\nAll issues fixed successfully!');
      console.log(`Available Login Credentials:`);
      console.log(`Admin: ${adminUser.email} / admin123`);
      console.log(`Client: ${cloudClient.email} / cloud123`);
      console.log(`Tech: ${techUser.email} / tech123`);
      
      console.log('\nNEXT STEPS FOR FIX:');
      console.log('1. Copy the admin token above to your browser');
      console.log('2. Open browser developer tools (F12)');
      console.log('3. In the Console tab, run:');
      console.log(`   localStorage.setItem('token', 'PASTE_TOKEN_HERE')`);
      console.log(`   localStorage.setItem('user', JSON.stringify({"_id":"${adminUser._id}","username":"admin","email":"admin@beta-tech.com","role":"admin"}))`);
      console.log('4. Refresh the admin dashboard');
      
      mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Error fixing issues:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
