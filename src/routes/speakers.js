const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database/db');
const { validateSpeaker } = require('../middleware/validation');

// Allowed sort fields for the speakers resource
const ALLOWED_SORT_FIELDS = ['name', 'type', 'id', 'status', 'created_at'];

/**
 * GET /speakers
 * Supports:
 * - Search by query parameter (e.g. ?type=Subwoofer, ?name=JBL, or ?search=sound)
 * - Twist Requirement:
 *   ?sort=name&order=asc|desc
 *   Unknown sort fields return 400 with "Cannot sort by that field"
 */
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM speakers';
    const params = [];
    const whereClauses = [];

    // Search by type (e.g. ?type=Subwoofer or ?type=PA)
    if (req.query.type) {
      whereClauses.push('LOWER(type) LIKE LOWER(?)');
      params.push(`%${req.query.type.trim()}%`);
    }

    // Search by name (e.g. ?name=Bose)
    if (req.query.name) {
      whereClauses.push('LOWER(name) LIKE LOWER(?)');
      params.push(`%${req.query.name.trim()}%`);
    }

    // General search across name and type (e.g. ?search=line)
    if (req.query.search) {
      whereClauses.push('(LOWER(name) LIKE LOWER(?) OR LOWER(type) LIKE LOWER(?))');
      params.push(`%${req.query.search.trim()}%`, `%${req.query.search.trim()}%`);
    }

    // Filter by status if provided (e.g. ?status=Available)
    if (req.query.status) {
      whereClauses.push('LOWER(status) = LOWER(?)');
      params.push(req.query.status.trim());
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // TWIST IMPLEMENTATION: Sorting
    if (req.query.sort !== undefined) {
      const sortField = req.query.sort.trim().toLowerCase();

      // Check if sort field is valid
      if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
        return res.status(400).json({
          error: 'Cannot sort by that field',
          message: 'Cannot sort by that field'
        });
      }

      // Check sort order (asc or desc)
      const order = req.query.order && req.query.order.trim().toLowerCase() === 'desc' ? 'DESC' : 'ASC';

      // Sort with COLLATE NOCASE for case-insensitive alphabetical sorting
      if (sortField === 'name' || sortField === 'type' || sortField === 'status') {
        query += ` ORDER BY ${sortField} COLLATE NOCASE ${order}`;
      } else {
        query += ` ORDER BY ${sortField} ${order}`;
      }
    } else {
      // Default ordering by id
      query += ' ORDER BY id ASC';
    }

    const speakers = await all(query, params);
    return res.status(200).json(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /speakers/:id
 * Retrieve a single speaker by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid speaker ID', message: 'Invalid speaker ID' });
    }

    const speaker = await get('SELECT * FROM speakers WHERE id = ?', [id]);
    if (!speaker) {
      return res.status(404).json({ error: 'Speaker not found', message: 'Speaker not found' });
    }

    return res.status(200).json(speaker);
  } catch (error) {
    console.error('Error fetching speaker:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /speakers
 * Create a new speaker
 * Status code: 201 Created
 */
router.post('/', validateSpeaker, async (req, res) => {
  try {
    const { name, type, status } = req.body;
    const speakerStatus = status && status.trim() ? status.trim() : 'Available';

    const result = await run(
      'INSERT INTO speakers (name, type, status) VALUES (?, ?, ?)',
      [name.trim(), type.trim(), speakerStatus]
    );

    const newSpeaker = await get('SELECT * FROM speakers WHERE id = ?', [result.lastID]);
    return res.status(201).json({
      message: 'Speaker added successfully',
      data: newSpeaker
    });
  } catch (error) {
    console.error('Error adding speaker:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /speakers/:id
 * Update an existing speaker
 * Status code: 200 OK
 */
router.put('/:id', validateSpeaker, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid speaker ID', message: 'Invalid speaker ID' });
    }

    // Check if speaker exists
    const existingSpeaker = await get('SELECT * FROM speakers WHERE id = ?', [id]);
    if (!existingSpeaker) {
      return res.status(404).json({ error: 'Speaker not found', message: 'Speaker not found' });
    }

    const { name, type, status } = req.body;
    const speakerStatus = status && status.trim() ? status.trim() : existingSpeaker.status;

    await run(
      'UPDATE speakers SET name = ?, type = ?, status = ? WHERE id = ?',
      [name.trim(), type.trim(), speakerStatus, id]
    );

    const updatedSpeaker = await get('SELECT * FROM speakers WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Speaker updated successfully',
      data: updatedSpeaker
    });
  } catch (error) {
    console.error('Error updating speaker:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /speakers/:id
 * Delete a speaker by ID
 * Status code: 200 OK
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid speaker ID', message: 'Invalid speaker ID' });
    }

    const existingSpeaker = await get('SELECT * FROM speakers WHERE id = ?', [id]);
    if (!existingSpeaker) {
      return res.status(404).json({ error: 'Speaker not found', message: 'Speaker not found' });
    }

    await run('DELETE FROM speakers WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Speaker deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting speaker:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
