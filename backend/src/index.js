import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Route imports
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import technicalRoutes from './routes/technical.js';
import chatRoutes from './routes/chat.js';

// Import socket initialization
import { initSocket } from './socket/socketServer.js';

// Load environment variables before any other code
dotenv.config();

// Validate all required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with error handling
let io;
try {
  io = initSocket(httpServer);
  app.set('io', io);
} catch (error) {
  console.error('Failed to initialize socket server:', error);
  process.exit(1);
}

// Security middleware configuration
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.NODE_ENV === 'development' ? '*' : '']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),
  morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined', {
    skip: (req) => req.path === '/api/health-check'
  })
];

// Apply security middleware
app.use(securityMiddleware);

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes except health check
app.use((req, res, next) => {
  if (req.path === '/api/health-check') return next();
  limiter(req, res, next);
});

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow specific production domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:5002'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked for origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle CORS preflight errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.log('CORS blocked for origin:', req.headers.origin);
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin
    });
  }
  next(err);
});

// Body parsing middleware with size limits and validation
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging with more details
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Health check endpoint with detailed information
app.get('/api/health-check', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.json(healthCheck);
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/chat', chatRoutes);

// MongoDB connection with retry mechanism
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000
      });
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
        if (err.name === 'MongoNetworkError') {
          setTimeout(() => connectDB(1), 5000);
        }
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(() => connectDB(1), 5000);
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
      });
      
      return conn;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All MongoDB connection attempts failed');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log error with request details
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    user: req.user ? req.user.id : 'anonymous'
  });
  
  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
      
    case 'UnauthorizedError':
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token'
      });
      
    case 'ForbiddenError':
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
      
    default:
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message
      });
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed.');
  });
  
  // Close Socket.IO connections
  if (io) {
    io.close(() => {
      console.log('Socket.IO server closed.');
    });
  }
  
  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
  
  // Exit process
  process.exit(0);
};

// Handle various shutdown signals
['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('Uncaught Exception');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  gracefulShutdown('Unhandled Rejection');
});

// Start server
const findAvailablePort = async (startPort) => {
  const net = await import('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${startPort} is in use, trying ${startPort + 1}`);
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

const startServer = async () => {
  try {
    const port = await findAvailablePort(5002);
    console.log(`Starting server on port ${port}`);
    
    httpServer.listen(port, () => {
      console.log(`Server Information:
------------------
Status: Running
Port: ${port}
Environment: ${process.env.NODE_ENV || 'development'}
MongoDB: Connected
Socket.IO: Initialized
Rate Limit: ${limiter.max} requests per ${limiter.windowMs/1000}s
Security: Enabled (Helmet, CORS, Rate Limiting)
----------------------------------------`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
