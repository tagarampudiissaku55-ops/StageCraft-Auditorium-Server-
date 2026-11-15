const fs = require('fs');
const path = require('path');
const { initDB, db } = require('../src/database/db');

const DB_PATH = path.join(__dirname, '..', 'stagecraft.db');

async function resetDatabase() {
  console.log('Resetting StageCraft Auditorium Database...');
  
  // Close existing db connection if open
  await new Promise((resolve) => db.close(resolve));

  // Remove existing db file if it exists
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing stagecraft.db file.');
  }

  // Require fresh db module
  delete require.cache[require.resolve('../src/database/db')];
  const freshDb = require('../src/database/db');

  await freshDb.initDB();
  console.log('Database successfully re-initialized and seeded with fresh demo data!');
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
