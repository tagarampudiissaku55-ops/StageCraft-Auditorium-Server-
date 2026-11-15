const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'stagecraft.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Helper for queries returning multiple rows (SELECT)
const all = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper for queries returning single row (SELECT)
const get = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper for INSERT / UPDATE / DELETE queries
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Helper for multi-statement execution
const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Initialize schema and seed data if tables are empty
const initDB = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await exec(schemaSql);

  // Check if speakers table is empty; if so, populate initial seed data
  const speakerCount = await get('SELECT COUNT(*) AS count FROM speakers');
  if (speakerCount.count === 0) {
    await seedDB();
  }
};

const seedDB = async () => {
  // Seed Technicians
  await run(`
    INSERT INTO technicians (name, email, phone) VALUES
    ('Issaku Tagarampudi', 'issaku.tagarampudi@stagecraft.edu', '555-0101'),
    ('Aria Chen', 'aria.chen@stagecraft.edu', '555-0102'),
    ('Marcus Vance', 'marcus.vance@stagecraft.edu', '555-0103')
  `);

  // Seed Speakers (StageCraft Sound Equipment)
  // Names intentionally chosen across the alphabet so sorting A-Z and Z-A is very clear
  await run(`
    INSERT INTO speakers (name, type, status) VALUES
    ('Alpha Sub Pro 18', 'Subwoofer', 'Lent'),
    ('Bose F1 Model 812', 'Line Array', 'Available'),
    ('Electro-Voice ELX200', 'PA Speaker', 'Lent'),
    ('JBL EON715 Active', 'PA Speaker', 'Available'),
    ('Mackie Thump15A', 'Stage Monitor', 'Available'),
    ('QSC K12.2 Loudspeaker', 'PA Speaker', 'Available'),
    ('Yamaha DXR15mkII', 'Stage Monitor', 'Lent'),
    ('Zephyr Stage Wedge 12', 'Stage Monitor', 'Available')
  `);

  // Seed Bookings (Speakers lent to clubs, tracked by technicians)
  await run(`
    INSERT INTO bookings (speaker_id, technician_id, club_name, event_name, borrow_date, return_date, status) VALUES
    (1, 1, 'Music Society', 'Annual Rock Fest', '2026-11-10', '2026-11-13', 'Active'),
    (3, 2, 'Drama Club', 'Fall Musical Rehearsal', '2026-11-11', '2026-11-14', 'Active'),
    (7, 1, 'Dance Crew', 'Choreography Showcase', '2026-11-08', '2026-11-10', 'Late')
  `);
};

module.exports = {
  db,
  all,
  get,
  run,
  exec,
  initDB,
  seedDB
};
