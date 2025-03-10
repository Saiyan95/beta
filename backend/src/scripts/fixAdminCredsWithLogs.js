import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@beta-tech.com';
const ADMIN_PASSWORD = 'admin123';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beta-tech-support')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // First, get all users to see what's in the database
      const allUsers = await User.find();
      console.log(`Total users in database: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.email} (${user.role})`);
      });
      
      // Find admin user and check details
      const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
      
      if (existingAdmin) {
        console.log('\nFound admin user:');
        console.log(`ID: ${existingAdmin._id}`);
        console.log(`Role: ${existingAdmin.role}`);
        console.log(`Email: ${existingAdmin.email}`);
        console.log(`Username: ${existingAdmin.username}`);
        console.log(`First Name: ${existingAdmin.firstName}`);
        console.log(`Last Name: ${existingAdmin.lastName}`);
        
        // Test password
        const isMatch = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.password);
        console.log(`Password match: ${isMatch ? 'YES' : 'NO'}`);
        
        if (!isMatch) {
          console.log('\nUpdating admin password...');
          // Create a new salt and hash for consistency
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
          
          // Update the user directly with updateOne to bypass any middleware
          const updateResult = await User.updateOne(
            { _id: existingAdmin._id },
            { $set: { password: hashedPassword }}
          );
          
          console.log('Update result:', updateResult);
          console.log('Password updated successfully!');
        }
        
        // Test that user.role is correct
        if (existingAdmin.role !== 'admin') {
          console.log('\nFixing admin role...');
          const roleUpdateResult = await User.updateOne(
            { _id: existingAdmin._id },
            { $set: { role: 'admin' }}
          );
          console.log('Role update result:', roleUpdateResult);
        }
      } else {
        console.log('\nNo admin user found with email:', ADMIN_EMAIL);
        console.log('Creating new admin user...');
        
        // Create a complete admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
        
        const newAdmin = new User({
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          // Add these nullable fields to avoid validation errors
          companyName: 'Beta Tech',
          department: 'IT',
          phoneNumber: '123-456-7890'
        });
        
        await newAdmin.save();
        console.log('New admin created with ID:', newAdmin._id);
      }
      
      // Final verification - Get the admin again and test with code similar to the login endpoint
      console.log('\nFinal verification:');
      const finalAdmin = await User.findOne({ email: ADMIN_EMAIL });
      
      if (!finalAdmin) {
        console.log('ERROR: Admin not found after fixes!');
      } else {
        console.log(`Admin exists with ID: ${finalAdmin._id}`);
        console.log(`Admin role: ${finalAdmin.role}`);
        
        // Test password match exactly like the login endpoint
        const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, finalAdmin.password);
        console.log(`Password match check: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
        
        if (passwordMatch) {
          // Generate token exactly like the login endpoint
          const token = jwt.sign(
            { id: finalAdmin._id, role: finalAdmin.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
          );
          
          console.log('\n==========================================');
          console.log('ADMIN LOGIN DETAILS (VALIDATED)');
          console.log('==========================================');
          console.log('Email: admin@beta-tech.com');
          console.log('Password: admin123');
          console.log('\nJSON response that will be sent to frontend:');
          console.log(JSON.stringify({
            token,
            user: {
              id: finalAdmin._id,
              username: finalAdmin.username,
              email: finalAdmin.email,
              role: finalAdmin.role
            }
          }, null, 2));
          console.log('==========================================');
          
          // For browser testing
          console.log('\nBrowser test commands:');
          console.log(`localStorage.setItem('token', '${token}');`);
          console.log(`localStorage.setItem('user', '${JSON.stringify({
            id: finalAdmin._id,
            username: finalAdmin.username,
            email: finalAdmin.email,
            role: finalAdmin.role
          })}');`);
        } else {
          console.log('CRITICAL ERROR: Password still not matching after updates!');
        }
      }
      
      mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Script error:', error);
      mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
