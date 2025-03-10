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
      // 1. Check if admin exists
      const admin = await User.findOne({ email: ADMIN_EMAIL });
      
      if (!admin) {
        console.log('Admin user not found! Creating new admin user...');
        
        // Create admin user
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
        console.log('New admin created with ID:', newAdmin._id);
      } else {
        console.log('Admin user found with ID:', admin._id);
        console.log('Current role:', admin.role);
        
        // 2. Test password match
        const isMatch = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
        console.log('Password match test:', isMatch ? 'PASSED ✓' : 'FAILED ✗');
        
        if (!isMatch) {
          console.log('Updating admin password...');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
          admin.password = hashedPassword;
          await admin.save();
          console.log('Admin password updated successfully');
        }
        
        // 3. Test role
        if (admin.role !== 'admin') {
          console.log('Fixing admin role...');
          admin.role = 'admin';
          await admin.save();
          console.log('Admin role updated successfully');
        }
      }
      
      // 4. Find admin again (after potential updates)
      const updatedAdmin = await User.findOne({ email: ADMIN_EMAIL });
      
      // 5. Generate JWT token - this tests the JWT_SECRET
      const token = jwt.sign(
        { id: updatedAdmin._id, role: updatedAdmin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('\n==========================================');
      console.log('JWT TOKEN TEST');
      console.log('==========================================');
      console.log('JWT Secret being used:', process.env.JWT_SECRET || 'your-secret-key');
      console.log('Token generated successfully:', !!token);
      
      // 6. Verify token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token verification: PASSED ✓');
        console.log('Decoded token:', decoded);
      } catch (err) {
        console.log('Token verification: FAILED ✗');
        console.error('Token verification error:', err.message);
      }
      
      console.log('\n==========================================');
      console.log('ADMIN LOGIN CREDENTIALS');
      console.log('==========================================');
      console.log('Email: admin@beta-tech.com');
      console.log('Password: admin123');
      console.log('==========================================');
      console.log('\nFOR TESTING IN BROWSER CONSOLE:');
      console.log(`localStorage.setItem('token', '${token}');`);
      console.log(`localStorage.setItem('user', '${JSON.stringify({
        id: updatedAdmin._id,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        role: updatedAdmin.role
      })}');`);
      console.log('==========================================');
      
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
