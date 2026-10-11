import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../services/api';
import { Card, Button, Form, ListGroup, Badge, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaRegClock, FaCalendar } from 'react-icons/fa';

const EMPTY_LESSON = { title: '', duration: '', notes: '', date: '' };

const LessonsList = ({ courseId }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(EMPTY_LESSON);
  const [editMode, setEditMode] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lessons/course/${courseId}`);
      setLessons(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Errore nel caricamento delle lezioni');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const { totalMinutes, completedMinutes } = useMemo(
    () =>
      lessons.reduce(
        (acc, lesson) => ({
          totalMinutes: acc.totalMinutes + (lesson.duration || 0),
          completedMinutes: acc.completedMinutes + (lesson.completed ? lesson.duration || 0 : 0),
        }),
        { totalMinutes: 0, completedMinutes: 0 }
      ),
    [lessons]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLesson({ ...currentLesson, [name]: value });
  };

  const resetForm = () => {
    setCurrentLesson(EMPTY_LESSON);
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...currentLesson, duration: parseInt(currentLesson.duration, 10) };
      if (editMode) {
        await axios.put(`/api/lessons/${currentLesson._id}`, payload);
      } else {
        await axios.post(`/api/lessons/course/${courseId}`, payload);
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
      date: lesson.date ? new Date(lesson.date).toISOString().split('T')[0] : '',
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (lesson) => {
    if (window.confirm(`Eliminare la lezione "${lesson.title}"?`)) {
      try {
        await axios.delete(`/api/lessons/${lesson._id}/course/${courseId}`);
        fetchLessons();
      } catch (err) {
        setError("Errore nell'eliminazione della lezione");
        console.error(err);
      }
    }
  };

  const toggleCompletion = async (lesson) => {
    try {
      await axios.put(`/api/lessons/${lesson._id}`, { completed: !lesson.completed });
      fetchLessons();
    } catch (err) {
      setError("Errore nell'aggiornamento della lezione");
      console.error(err);
    }
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Caricamento…</span>
        </Spinner>
      </div>
    );
  }

  const progressPercent = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  return (
    <div className="lessons-container">
      <Card className="stats-card mb-4">
        <Card.Header>
          <h2 className="h6 mb-0">Statistiche lezioni</h2>
        </Card.Header>
        <Card.Body>
          <Row className="text-center g-3">
            <Col xs={4}>
              <div className="stat-value">{lessons.length}</div>
              <div className="text-body-secondary small">Lezioni</div>
            </Col>
            <Col xs={4}>
              <div className="stat-value">{totalMinutes}</div>
              <div className="text-body-secondary small">Minuti totali</div>
            </Col>
            <Col xs={4}>
              <div className="stat-value">{totalMinutes - completedMinutes}</div>
              <div className="text-body-secondary small">Minuti da seguire</div>
            </Col>
          </Row>

          <div
            className="progress"
            role="progressbar"
            aria-label="Lezioni completate"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-center small text-body-secondary mt-2 mb-0">
            {progressPercent}% delle lezioni completate
          </p>
        </Card.Body>
      </Card>

      <div className="section-header">
        <h2 className="h5 mb-0">Lezioni</h2>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus className="me-2" size={14} aria-hidden="true" />
          Aggiungi lezione
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="my-3" role="alert">
          {error}
        </Alert>
      )}

      {lessons.length === 0 ? (
        <Alert variant="info">
          Non ci sono lezioni per questo corso. Aggiungi la tua prima lezione!
        </Alert>
      ) : (
        <ListGroup className="lesson-list mb-4">
          {lessons.map((lesson) => (
            <ListGroup.Item key={lesson._id} className={lesson.completed ? 'is-done' : undefined}>
              <div className="item-row">
                <div className="item-main">
                  <button
                    type="button"
                    className="toggle-done"
                    aria-pressed={lesson.completed === true}
                    aria-label={
                      lesson.completed
                        ? `Segna la lezione "${lesson.title}" come da seguire`
                        : `Segna la lezione "${lesson.title}" come completata`
                    }
                    onClick={() => toggleCompletion(lesson)}
                  >
                    <FaCheck size={12} aria-hidden="true" />
                  </button>

                  <div className="item-body">
                    <p className="item-title">{lesson.title}</p>
                    {lesson.notes && <div className="item-notes">{lesson.notes}</div>}
                    {lesson.date && (
                      <div className="item-notes">
                        <FaCalendar size={12} className="me-1" aria-hidden="true" />
                        <span className="visually-hidden">Data: </span>
                        {new Date(lesson.date).toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="item-controls">
                  <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                    <FaRegClock size={12} aria-hidden="true" />
                    <span className="visually-hidden">Durata: </span>
                    {lesson.duration} min
                  </Badge>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="icon-button"
                    onClick={() => handleEdit(lesson)}
                    title={`Modifica "${lesson.title}"`}
                    aria-label={`Modifica la lezione ${lesson.title}`}
                  >
                    <FaEdit aria-hidden="true" />
                  </Button>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="icon-button"
                    onClick={() => handleDelete(lesson)}
                    title={`Elimina "${lesson.title}"`}
                    aria-label={`Elimina la lezione ${lesson.title}`}
                  >
                    <FaTrash aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        centered
        scrollable
        aria-labelledby="titolo-form-lezione"
      >
        <Modal.Header closeButton closeLabel="Chiudi">
          <Modal.Title id="titolo-form-lezione" className="h5 mb-0">
            {editMode ? 'Modifica lezione' : 'Nuova lezione'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="lezione-titolo">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentLesson.title}
                onChange={handleInputChange}
                placeholder="Inserisci il titolo della lezione"
                required
                autoFocus
              />
            </Form.Group>

            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3" controlId="lezione-durata">
                  <Form.Label>Durata (minuti)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    min="1"
                    value={currentLesson.duration}
                    onChange={handleInputChange}
                    placeholder="Es: 90"
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group className="mb-3" controlId="lezione-data">
                  <Form.Label>Data <span className="field-optional">(facoltativo)</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={currentLesson.date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="lezione-note">
              <Form.Label>Note <span className="field-optional">(facoltativo)</span></Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                value={currentLesson.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Aula, materiale da portare, ecc."
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="flex-wrap gap-2 justify-content-end">
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
              Annulla
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? 'Aggiorna' : 'Salva'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default LessonsList;
