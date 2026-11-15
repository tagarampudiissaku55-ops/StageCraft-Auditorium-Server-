// Middleware for request validation

const validateSpeaker = (req, res, next) => {
  const { name, type } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Name and type are required and cannot be empty',
      message: 'Name and type are required and cannot be empty',
      details: 'Field "name" is missing or empty'
    });
  }

  if (!type || typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({
      error: 'Name and type are required and cannot be empty',
      message: 'Name and type are required and cannot be empty',
      details: 'Field "type" is missing or empty'
    });
  }

  next();
};

const validateTechnician = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Technician name and email are required',
      message: 'Technician name and email are required',
      details: 'Field "name" is missing or empty'
    });
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: 'Technician name and email are required',
      message: 'Technician name and email are required',
      details: 'Field "email" is missing or empty'
    });
  }

  next();
};

const validateBooking = (req, res, next) => {
  const { speaker_id, technician_id, club_name, event_name, borrow_date } = req.body;

  if (!speaker_id || isNaN(parseInt(speaker_id, 10))) {
    return res.status(400).json({
      error: 'Valid speaker_id is required',
      message: 'Valid speaker_id is required'
    });
  }

  if (!technician_id || isNaN(parseInt(technician_id, 10))) {
    return res.status(400).json({
      error: 'Valid technician_id is required',
      message: 'Valid technician_id is required'
    });
  }

  if (!club_name || typeof club_name !== 'string' || club_name.trim() === '') {
    return res.status(400).json({
      error: 'Club name is required',
      message: 'Club name is required'
    });
  }

  if (!event_name || typeof event_name !== 'string' || event_name.trim() === '') {
    return res.status(400).json({
      error: 'Event name is required',
      message: 'Event name is required'
    });
  }

  if (!borrow_date || typeof borrow_date !== 'string' || borrow_date.trim() === '') {
    return res.status(400).json({
      error: 'Borrow date is required',
      message: 'Borrow date is required'
    });
  }

  next();
};

module.exports = {
  validateSpeaker,
  validateTechnician,
  validateBooking
};
