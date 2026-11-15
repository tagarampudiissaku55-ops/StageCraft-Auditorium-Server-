const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database/db');
const { validateTechnician } = require('../middleware/validation');

/**
 * GET /technicians
 * Retrieve all technicians
 */
router.get('/', async (req, res) => {
  try {
    const technicians = await all('SELECT * FROM technicians ORDER BY id ASC');
    return res.status(200).json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /technicians/:id
 * Retrieve a technician by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid technician ID', message: 'Invalid technician ID' });
    }

    const technician = await get('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found', message: 'Technician not found' });
    }

    return res.status(200).json(technician);
  } catch (error) {
    console.error('Error fetching technician:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /technicians
 * Add a new technician
 * Status code: 201 Created
 */
router.post('/', validateTechnician, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const result = await run(
      'INSERT INTO technicians (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), phone ? phone.trim() : null]
    );

    const newTechnician = await get('SELECT * FROM technicians WHERE id = ?', [result.lastID]);
    return res.status(201).json({
      message: 'Technician added successfully',
      data: newTechnician
    });
  } catch (error) {
    console.error('Error adding technician:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        error: 'A technician with this email already exists',
        message: 'A technician with this email already exists'
      });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /technicians/:id
 * Update an existing technician
 * Status code: 200 OK
 */
router.put('/:id', validateTechnician, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid technician ID', message: 'Invalid technician ID' });
    }

    const existingTechnician = await get('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!existingTechnician) {
      return res.status(404).json({ error: 'Technician not found', message: 'Technician not found' });
    }

    const { name, email, phone } = req.body;
    await run(
      'UPDATE technicians SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name.trim(), email.trim(), phone ? phone.trim() : null, id]
    );

    const updatedTechnician = await get('SELECT * FROM technicians WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Technician updated successfully',
      data: updatedTechnician
    });
  } catch (error) {
    console.error('Error updating technician:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        error: 'A technician with this email already exists',
        message: 'A technician with this email already exists'
      });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /technicians/:id
 * Delete a technician by ID
 * Status code: 200 OK
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid technician ID', message: 'Invalid technician ID' });
    }

    const existingTechnician = await get('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!existingTechnician) {
      return res.status(404).json({ error: 'Technician not found', message: 'Technician not found' });
    }

    await run('DELETE FROM technicians WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Technician deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting technician:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
