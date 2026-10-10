const Course = require('../models/Course');

// Prendi tutti i corsi 
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

// Create a new course
exports.createCourse = async (req, res, next) => {
  const course = new Course(req.body);
  try {
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (err) {
    next(err);
  }
};

// Get a single course
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Corso non trovato' });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// Update a course
exports.updateCourse = async (req, res, next) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Corso non trovato' });
    }
    
    res.json(updatedCourse);
  } catch (err) {
    next(err);
  }
};

// Delete a course
exports.deleteCourse = async (req, res, next) => {
  try {
    const result = await Course.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Corso non trovato' });
    }
    res.status(200).json({ message: 'Corso eliminato con successo' });
  } catch (err) {
    next(err);
  }
};