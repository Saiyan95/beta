import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  checkEmailExists, 
  verifyToken as verifyTokenController,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// General login route - add this for the admin login to work
router.post('/login', login);

// Add standard register endpoint to match frontend expectation
router.post('/register', register);

// Client routes
router.post('/client/signup', register);
router.post('/client/login', login);

// Technician routes
router.post('/technician/signup', register);
router.post('/technician/login', login);

// Email check route
router.get('/check-email', checkEmailExists);

// Token verification route
router.get('/verify', verifyToken, verifyTokenController);

// Protected routes
router.get('/profile', verifyToken, getProfile);

// Admin-only routes
router.get('/users', verifyToken, checkRole(['admin']), (req, res) => {
  // This route would typically call a controller function to get all users
  // For now, it's just a placeholder
  res.status(200).json({ message: 'Admin access granted' });
});

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
