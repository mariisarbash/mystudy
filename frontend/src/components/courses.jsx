import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';
import axios from '../services/api';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stati per il form di aggiunta/modifica dei corsi
  const [showForm, setShowForm] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    name: '',
    professor: '',
    credits: '',
    color: '#3a7bd5'
  });
  const [editMode, setEditMode] = useState(false);

  // Carica i corsi all'avvio del componente
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses');
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei corsi');
      setLoading(false);
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({ ...currentCourse, [name]: value });
  };

  const resetForm = () => {
    setCurrentCourse({
      name: '',
      professor: '',
      credits: '',
      color: '#3a7bd5'
    });
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode) {
        // PATCH, not PUT: the API registers PATCH /api/courses/:id and the
        // controller does a partial merge (findByIdAndUpdate). Sending PUT
        // matched no route, so saving an edited course always returned 404.
        await axios.patch(`/api/courses/${currentCourse._id}`, currentCourse);
      } else {
        await axios.post('/api/courses', currentCourse);
      }
      
      fetchCourses();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError('Errore nel salvare il corso');
      console.error(err);
    }
  };

  const handleEdit = (course) => {
    setCurrentCourse(course);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo corso?')) {
      try {
        await axios.delete(`/api/courses/${id}`);
        fetchCourses();
      } catch (err) {
        setError('Errore nell\'eliminazione del corso');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>I miei Corsi</h1>
        <Button variant="primary" onClick={() => {
          resetForm();
          setShowForm(true);
        }}>
          Aggiungi Corso
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {courses.length === 0 ? (
        <Alert variant="info">
          Non hai ancora aggiunto corsi. Clicca su "Aggiungi Corso" per iniziare!
        </Alert>
      ) : (
        <Row>
          {courses.map(course => (
            <Col key={course._id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header style={{ backgroundColor: course.color || '#3a7bd5', color: 'white' }}>
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-0">{course.name}</h5>
                    <div>
                      <Button
                        variant="light"
                        size="sm"
                        className="me-1 text-secondary"
                        onClick={() => handleEdit(course)}
                        title={`Modifica ${course.name}`}
                        aria-label={`Modifica il corso ${course.name}`}
                      >
                        <FaEdit aria-hidden="true" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="text-danger"
                        onClick={() => handleDelete(course._id)}
                        title={`Elimina ${course.name}`}
                        aria-label={`Elimina il corso ${course.name}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="mb-3">
                    <strong>Professore:</strong> {course.professor}
                  </div>
                  <div className="mb-3">
                    <strong>Crediti:</strong> {course.credits}
                  </div>
                  {course.description && (
                    <div className="mb-3">
                      <strong>Descrizione:</strong> {course.description}
                    </div>
                  )}
                  <div className="mt-auto">
                    <Link to={`/courses/${course._id}`} className="btn btn-outline-primary w-100">
                      Visualizza Dettagli
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      <Modal show={showForm} onHide={() => setShowForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Modifica' : 'Aggiungi'} Corso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nome del Corso</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentCourse.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Professore</Form.Label>
              <Form.Control
                type="text"
                name="professor"
                value={currentCourse.professor}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Crediti</Form.Label>
              <Form.Control
                type="number"
                name="credits"
                value={currentCourse.credits}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={currentCourse.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Colore</Form.Label>
              <Form.Control
                type="color"
                name="color"
                value={currentCourse.color}
                onChange={handleInputChange}
                title="Scegli un colore per il corso"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowForm(false)}
                className="me-2"
              >
                Annulla
              </Button>
              <Button variant="primary" type="submit">
                Salva
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Courses;