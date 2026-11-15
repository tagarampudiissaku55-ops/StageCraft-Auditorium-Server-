const express = require('express');
const path = require('path');
const speakersRouter = require('./routes/speakers');
const techniciansRouter = require('./routes/technicians');
const bookingsRouter = require('./routes/bookings');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files (Interactive Demo Dashboard)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API information endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    project: 'StageCraft Auditorium Sound Equipment Tracking System',
    brief: 'BDF Group Assignment - Theme 25: Sound Equipment',
    group: 'JP-GAI2C-G10 (Issaku Tagarampudi)',
    status: 'Running',
    endpoints: {
      speakers: '/speakers',
      technicians: '/technicians',
      bookings: '/bookings',
      bookings_join: '/bookings/joined',
      twist_demo_asc: '/speakers?sort=name&order=asc',
      twist_demo_desc: '/speakers?sort=name&order=desc',
      twist_demo_invalid: '/speakers?sort=colour'
    }
  });
});

// Mount Routes
app.use('/speakers', speakersRouter);
app.use('/technicians', techniciansRouter);
app.use('/bookings', bookingsRouter);

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;
