const app = require('./app');
const { initDB } = require('./database/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize SQLite tables & seed if empty
    await initDB();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` StageCraft Auditorium Server running on port ${PORT}`);
      console.log(` Group: JP-GAI2C-G10 (Issaku Tagarampudi)`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Try Twist: http://localhost:${PORT}/speakers?sort=name&order=asc`);
      console.log(` Try Join:  http://localhost:${PORT}/bookings`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
