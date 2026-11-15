const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database/db');
const { validateBooking } = require('../middleware/validation');

// Shared SQL for the join query linking bookings, technicians, and speakers
const JOIN_BOOKINGS_SQL = `
  SELECT 
    b.id,
    b.club_name,
    b.event_name,
    b.borrow_date,
    b.return_date,
    b.status,
    b.created_at,
    b.technician_id,
    t.name AS technician_name,
    t.email AS technician_email,
    b.speaker_id,
    s.name AS speaker_name,
    s.type AS speaker_type
  FROM bookings b
  JOIN technicians t ON b.technician_id = t.id
  JOIN speakers s ON b.speaker_id = s.id
`;

/**
 * GET /bookings
 * Primary endpoint & Join endpoint:
 * Returns all bookings with technician name and speaker name
 */
router.get('/', async (req, res) => {
  try {
    let query = JOIN_BOOKINGS_SQL;
    const params = [];
    const whereClauses = [];

    // Optional filter by status (e.g. ?status=Active or ?status=Late)
    if (req.query.status) {
      whereClauses.push('LOWER(b.status) = LOWER(?)');
      params.push(req.query.status.trim());
    }

    // Optional filter by club name (e.g. ?club=Music)
    if (req.query.club) {
      whereClauses.push('LOWER(b.club_name) LIKE LOWER(?)');
      params.push(`%${req.query.club.trim()}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY b.id ASC';

    const bookings = await all(query, params);
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /bookings/joined
 * Explicit alias endpoint for the required join endpoint:
 * Bookings with the technician name and the speaker name
 */
router.get('/joined', async (req, res) => {
  try {
    const bookings = await all(`${JOIN_BOOKINGS_SQL} ORDER BY b.id ASC`);
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching joined bookings:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /bookings/:id
 * Retrieve a specific booking with joined technician and speaker details
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid booking ID', message: 'Invalid booking ID' });
    }

    const booking = await get(`${JOIN_BOOKINGS_SQL} WHERE b.id = ?`, [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found', message: 'Booking not found' });
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /bookings
 * Create a new booking (lend speaker to a club)
 * Status code: 201 Created
 */
router.post('/', validateBooking, async (req, res) => {
  try {
    const { speaker_id, technician_id, club_name, event_name, borrow_date, return_date, status } = req.body;

    // Verify technician exists
    const technician = await get('SELECT * FROM technicians WHERE id = ?', [technician_id]);
    if (!technician) {
      return res.status(404).json({
        error: `Technician with ID ${technician_id} does not exist`,
        message: `Technician with ID ${technician_id} does not exist`
      });
    }

    // Verify speaker exists
    const speaker = await get('SELECT * FROM speakers WHERE id = ?', [speaker_id]);
    if (!speaker) {
      return res.status(404).json({
        error: `Speaker with ID ${speaker_id} does not exist`,
        message: `Speaker with ID ${speaker_id} does not exist`
      });
    }

    const bookingStatus = status && status.trim() ? status.trim() : 'Active';

    const result = await run(
      `INSERT INTO bookings (speaker_id, technician_id, club_name, event_name, borrow_date, return_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [speaker_id, technician_id, club_name.trim(), event_name.trim(), borrow_date.trim(), return_date || null, bookingStatus]
    );

    // Optionally update speaker status to 'Lent' when borrowed
    await run("UPDATE speakers SET status = 'Lent' WHERE id = ?", [speaker_id]);

    const newBooking = await get(`${JOIN_BOOKINGS_SQL} WHERE b.id = ?`, [result.lastID]);
    return res.status(201).json({
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    console.error('Error adding booking:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /bookings/:id
 * Update an existing booking (e.g. mark as Returned, update return_date)
 * Status code: 200 OK
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid booking ID', message: 'Invalid booking ID' });
    }

    const existingBooking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found', message: 'Booking not found' });
    }

    const {
      speaker_id = existingBooking.speaker_id,
      technician_id = existingBooking.technician_id,
      club_name = existingBooking.club_name,
      event_name = existingBooking.event_name,
      borrow_date = existingBooking.borrow_date,
      return_date = existingBooking.return_date,
      status = existingBooking.status
    } = req.body;

    await run(
      `UPDATE bookings 
       SET speaker_id = ?, technician_id = ?, club_name = ?, event_name = ?, borrow_date = ?, return_date = ?, status = ?
       WHERE id = ?`,
      [speaker_id, technician_id, club_name, event_name, borrow_date, return_date, status, id]
    );

    // If status updated to 'Returned', set speaker status to 'Available'
    if (status.toLowerCase() === 'returned') {
      await run("UPDATE speakers SET status = 'Available' WHERE id = ?", [speaker_id]);
    }

    const updatedBooking = await get(`${JOIN_BOOKINGS_SQL} WHERE b.id = ?`, [id]);
    return res.status(200).json({
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /bookings/:id
 * Delete a booking
 * Status code: 200 OK
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid booking ID', message: 'Invalid booking ID' });
    }

    const existingBooking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found', message: 'Booking not found' });
    }

    await run('DELETE FROM bookings WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Booking deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
