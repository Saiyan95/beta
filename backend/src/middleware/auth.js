import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Support both token formats (id and userId)
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      // Check if user still exists
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      
      // Attach user info to request with consistent userId field
      req.user = {
        userId,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied: insufficient permissions'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is accessing their own resource or has admin role
 * @param {string} paramName - Name of the parameter containing the resource owner ID
 */
export const checkOwnership = (paramName) => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName];
    
    if (req.user.role === 'admin' || req.user.userId === resourceOwnerId) {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. You can only access your own resources' });
  };
};

/**
 * Socket authentication middleware
 * @param {Object} socket - Socket.io socket object
 * @param {Function} next - Next function
 */
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Support both token formats (id and userId)
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        return next(new Error('Authentication error: Invalid token format'));
      }
      
      // Check if user still exists
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User no longer exists'));
      }
      
      // Attach user info to socket with consistent userId field
      socket.user = {
        userId,
        role: decoded.role,
        name: user.name
      };
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  } catch (error) {
    console.error('Socket auth middleware error:', error);
    return next(new Error('Server error'));
  }
};
