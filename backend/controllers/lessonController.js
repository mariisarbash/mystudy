const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

// Ottieni tutte le lezioni di un corso 
exports.getLessonsByCourse = async (req, res, next) => {
    try {
      const { courseId } = req.params;
      console.log(`Backend: Richiesta lezioni per il corso: ${courseId}`);
      
      // Uso diretto dell'ID senza conversione esplicita
      const lessons = await Lesson.find({ courseId });
      
      console.log(`Backend: Trovate ${lessons.length} lezioni`);
      res.json(lessons);
    } catch (error) {
      console.error('Backend error:', error);
      next(error);
    }
  };

// Crea una nuova lezione
exports.createLesson = async (req, res, next) => {
  try {
    console.log('Tentativo di creazione lezione:', {
      courseId: req.params.courseId,
      requestBody: req.body
    });
    
    const lesson = new Lesson({
      courseId: req.params.courseId,
      title: req.body.title,
      duration: parseInt(req.body.duration) || 0,
      notes: req.body.notes,
      date: req.body.date
    });

    const newLesson = await lesson.save();
    console.log('Lezione salvata con ID:', newLesson._id);
    
    // Aggiorna il corso con riferimento alla nuova lezione
    await Course.findByIdAndUpdate(req.params.courseId, 
      { $push: { lessons: newLesson._id } }
    );
    
    res.status(201).json(newLesson);
  } catch (error) {
    console.error('Errore creazione lezione:', error);
    next(error);
  }
};

// Aggiorna una lezione
exports.updateLesson = async (req, res, next) => {
  try {
    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedLesson);
  } catch (error) {
    next(error);
  }
};

// Elimina una lezione
exports.deleteLesson = async (req, res, next) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    
    // Rimuovi riferimento dal corso
    await Course.findByIdAndUpdate(req.params.courseId, 
      { $pull: { lessons: req.params.id } }
    );
    
    res.json({ message: 'Lezione eliminata' });
  } catch (error) {
    next(error);
  }
};