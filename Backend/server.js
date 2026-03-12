const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require("dotenv").config();
const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const requestRoutes = require('./routes/requests');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

const socketAuth = require('./middleware/socketAuth');
const socketHandler = require('./socket/socketHandler');

const app = express();
const httpServer = createServer(app);


// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', limiter);


// Auth-specific stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // relaxed for development (was 10)
  message: { error: 'Too many authentication attempts.' },
});


// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined'));


// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);


// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});


// Socket.io authentication and handlers
io.use(socketAuth);
socketHandler(io);


// Global error handler
app.use((err, req, res, next) => {
  console.log('--- GLOBAL ERROR CAUGHT ---');
  console.log('Error Message:', err.message);
  console.log('Error Stack:', err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});


// MongoDB connection and server start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });


process.on('unhandledRejection', (err) => {
  console.error('🔥 UNHANDLED REJECTION! Shutting down...', err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
  process.exit(1);
});

module.exports = { app, io };
