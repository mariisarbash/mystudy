import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { Card, Button, Form, ListGroup, Badge, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaRegClock, FaCalendar } from 'react-icons/fa';

const LessonsList = ({ courseId }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    duration: '',
    notes: '',
    date: ''
  });
  const [editMode, setEditMode] = useState(false);

  // Statistiche
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [completedMinutes, setCompletedMinutes] = useState(0);

  useEffect(() => {
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    // Calcola statistiche
    let total = 0;
    let completed = 0;
    
    lessons.forEach(lesson => {
      total += lesson.duration || 0;
      if (lesson.completed) {
        completed += lesson.duration || 0;
      }
    });
    
    setTotalMinutes(total);
    setCompletedMinutes(completed);
  }, [lessons]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      console.log('Fetching lessons for courseId:', courseId);
      const response = await axios.get(`/api/lessons/course/${courseId}`);
      console.log('Lessons data received:', response.data);
      setLessons(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Errore nel caricamento delle lezioni');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLesson({ ...currentLesson, [name]: value });
  };

  const resetForm = () => {
    setCurrentLesson({
      title: '',
      duration: '',
      notes: '',
      date: ''
    });
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode) {
        await axios.put(`/api/lessons/${currentLesson._id}`, {
          ...currentLesson,
          duration: parseInt(currentLesson.duration)
        });
      } else {
        await axios.post(`/api/lessons/course/${courseId}`, {
          ...currentLesson,
          duration: parseInt(currentLesson.duration)
        });
      }
      
      fetchLessons();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError('Errore nel salvare la lezione');
    }
  };

  const handleEdit = (lesson) => {
    setCurrentLesson({
      ...lesson,
      date: lesson.date ? new Date(lesson.date).toISOString().split('T')[0] : ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa lezione?')) {
      try {
        await axios.delete(`/api/lessons/${id}/course/${courseId}`);
        fetchLessons();
      } catch (err) {
        setError('Errore nell\'eliminazione della lezione');
        console.error(err);
      }
    }
  };

  const toggleCompletion = async (lesson) => {
    try {
      await axios.put(`/api/lessons/${lesson._id}`, {
        ...lesson,
        completed: !lesson.completed
      });
      
      fetchLessons();
    } catch (err) {
      setError('Errore nell\'aggiornamento della lezione');
      console.error(err);
    }
  };

  if (loading && lessons.length === 0) {
    return <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>;
  }

  const progressPercent = totalMinutes > 0 
    ? Math.round((completedMinutes / totalMinutes) * 100) 
    : 0;

  return (
    <div className="lessons-container">
      {/* Statistiche */}
      <Card className="stats-card mb-4">
        <Card.Header>
          <h5 className="mb-0">Statistiche Lezioni</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <div className="stat-value">{lessons.length}</div>
              <div className="text-muted">Lezioni totali</div>
            </Col>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <div className="stat-value">{totalMinutes} min</div>
              <div className="text-muted">Durata totale</div>
            </Col>
            <Col md={4} className="text-center">
              <div className="stat-value">{totalMinutes - completedMinutes} min</div>
              <div className="text-muted">Ancora da completare</div>
            </Col>
          </Row>
          
          <div className="progress mt-4">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: `${progressPercent}%` }}
              aria-valuenow={progressPercent} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {progressPercent}%
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Header con titolo e pulsante di aggiunta */}
      <div className="section-header">
        <h3>Lezioni</h3>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus size={14} /> Aggiungi Lezione
        </Button>
      </div>
      
      {error && <Alert variant="danger" className="my-3">{error}</Alert>}
      
      {/* Lista lezioni */}
      {lessons.length === 0 ? (
        <Alert variant="info">
          Non ci sono lezioni per questo corso. Aggiungi la tua prima lezione!
        </Alert>
      ) : (
        <ListGroup className="lesson-list mb-4">
          {lessons.map(lesson => (
            <ListGroup.Item 
              key={lesson._id}
              className="d-flex align-items-center"
            >
              <div 
                className={`checkbox-container ${lesson.completed ? 'checked' : ''}`}
                onClick={() => toggleCompletion(lesson)}
              >
                {lesson.completed && <FaCheck size={12} />}
              </div>
              
              <div className="lesson-content">
                <h5 className={`lesson-title ${lesson.completed ? 'text-decoration-line-through' : ''}`}>
                  {lesson.title}
                </h5>
                {lesson.notes && (
                  <div className="lesson-notes">{lesson.notes}</div>
                )}
                {lesson.date && (
                  <div className="lesson-date text-muted small">
                    <FaCalendar size={12} className="me-1" />
                    {new Date(lesson.date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <Badge bg="light" text="dark" className="me-3 d-flex align-items-center gap-1">
                <FaRegClock size={12} /> {lesson.duration} min
              </Badge>
              
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => handleEdit(lesson)}
                >
                  <FaEdit />
                </Button>
                
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => handleDelete(lesson._id)}
                >
                  <FaTrash />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      
      {/* Form modale */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Modifica' : 'Aggiungi'} Lezione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentLesson.title}
                onChange={handleInputChange}
                placeholder="Inserisci il titolo della lezione"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Durata (minuti)</Form.Label>
              <Form.Control
                type="number"
                name="duration"
                value={currentLesson.duration}
                onChange={handleInputChange}
                placeholder="Es: 90"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={currentLesson.date}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                value={currentLesson.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Inserisci eventuali note sulla lezione"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowForm(false)}
              >
                Annulla
              </Button>
              <Button variant="primary" type="submit">
                {editMode ? 'Aggiorna' : 'Salva'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LessonsList;