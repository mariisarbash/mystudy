const StudySession = require('../models/StudySession');

// Prendi tutte le sessioni di studio 
exports.getStudySessions = async (req, res, next) => {
  try {
    const sessions = await StudySession.find().populate('course');
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// Create a new study session
exports.createStudySession = async (req, res, next) => {
  const session = new StudySession(req.body);
  try {
    const newSession = await session.save();
    res.status(201).json(newSession);
  } catch (err) {
    next(err);
  }
};

// Delete a study session
exports.deleteStudySession = async (req, res, next) => {
  try {
    const result = await StudySession.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Sessione non trovata' });
    }
    res.status(200).json({ message: 'Sessione eliminata con successo' });
  } catch (err) {
    next(err);
  }
};