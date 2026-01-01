const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Task = require('./models/Task');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();

// Debug logging
console.log('=== Server Startup ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 5000);

// CORS configuration - SINGLE DEFINITION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱 Development: Allowing origin:', origin);
      return callback(null, true);
    }
    
    // In production, allow specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'https://task-manager-frontend.vercel.app',
      'https://task-manager-frontend.onrender.com'
    ];
    
    console.log('🚀 Production: Checking origin:', origin);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware - USE ONLY ONCE
app.use(cors(corsOptions)); // REMOVED the duplicate app.use(cors())
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔌 Connecting to database...');
    
    // Sync database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Create associations
    User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Task.belongsTo(User, { foreignKey: 'userId' });
    
    // Sync models - SAFE for production
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Production: Safe database sync');
      await sequelize.sync(); // Don't use alter:true in production
    } else {
      console.log('🌱 Development: Full database sync');
      await sequelize.sync({ alter: true });
    }
    
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    
    // Try to start server anyway (for Render health checks)
    app.listen(PORT, () => {
      console.log(`⚠️ Server running WITHOUT database on port ${PORT}`);
      console.log(`⚠️ Health check will show database as disconnected`);
    });
  }
};

startServer();