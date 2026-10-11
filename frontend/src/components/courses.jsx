import React, { useCallback, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaClipboardList } from 'react-icons/fa';
import axios from '../services/api';
import SyllabusImportModal from './SyllabusImportModal';
import { surfaceFor, textOnSurface } from '../utils/color';
import './courses.css';

const EMPTY_COURSE = {
  name: '',
  professor: '',
  credits: '',
  description: '',
  color: '#3a7bd5',
};

function Courses() {
  const [courses, setCourses] = useState([]);
  /** topicsByCourse: { [courseId]: { total, completed } } */
  const [topicsByCourse, setTopicsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(EMPTY_COURSE);
  const [editMode, setEditMode] = useState(false);

  /** The course whose syllabus is being imported, plus why the dialog opened. */
  const [importTarget, setImportTarget] = useState(null);
  const [importIsPostCreate, setImportIsPostCreate] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses');
      const list = response.data || [];
      setCourses(list);

      // Each card shows how far along its syllabus is, so the list doubles as
      // a progress overview and as a prompt for the courses still missing one.
      const counts = await Promise.all(
        list.map((c) =>
          axios
            .get(`/api/topics/course/${c._id}`)
            .then((r) => [c._id, r.data || []])
            .catch(() => [c._id, []])
        )
      );
      setTopicsByCourse(
        Object.fromEntries(
          counts.map(([id, topics]) => [
            id,
            { total: topics.length, completed: topics.filter((t) => t.completed).length },
          ])
        )
      );
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento dei corsi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Deep link used by the dashboard and the onboarding CTA: /courses?nuovo=1
  // opens the creation dialog straight away.
  useEffect(() => {
    if (searchParams.get('nuovo') === '1') {
      setCurrentCourse(EMPTY_COURSE);
      setEditMode(false);
      setShowForm(true);
      searchParams.delete('nuovo');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({ ...currentCourse, [name]: value });
  };

  const resetForm = () => {
    setCurrentCourse(EMPTY_COURSE);
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
        await fetchCourses();
        setShowForm(false);
        resetForm();
      } else {
        const created = await axios.post('/api/courses', currentCourse);
        await fetchCourses();
        setShowForm(false);
        resetForm();
        // The point of the product is the syllabus, so offer it as the very
        // next step instead of leaving it two clicks away inside the course.
        // Closing the dialog is a complete, valid outcome.
        setImportIsPostCreate(true);
        setImportTarget(created.data);
      }
    } catch (err) {
      setError('Errore nel salvare il corso');
      console.error(err);
    }
  };

  const handleEdit = (course) => {
    setCurrentCourse({ ...EMPTY_COURSE, ...course });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (course) => {
    if (window.confirm(`Sei sicuro di voler eliminare il corso "${course.name}"?`)) {
      try {
        await axios.delete(`/api/courses/${course._id}`);
        fetchCourses();
      } catch (err) {
        setError("Errore nell'eliminazione del corso");
        console.error(err);
      }
    }
  };

  const openImport = (course) => {
    setImportIsPostCreate(false);
    setImportTarget(course);
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Caricamento…</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="my-4 my-md-5">
      <div className="courses-header">
        <h1 className="h2 mb-0">I miei corsi</h1>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus className="me-2" aria-hidden="true" />
          Aggiungi corso
        </Button>
      </div>

      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Card className="courses-empty shadow-sm">
          <Card.Body className="text-center p-4 p-md-5">
            <h2 className="h5">Non hai ancora nessun corso</h2>
            <p className="text-body-secondary mb-4">
              Crea il primo corso, poi incolla il suo programma per ottenere la lista degli
              argomenti da spuntare.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Crea il tuo primo corso
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {courses.map((course) => {
            const { total = 0, completed = 0 } = topicsByCourse[course._id] || {};
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            // The colour is user-chosen, so darken it as far as white text
            // needs to stay above the AA contrast minimum.
            const headerBg = surfaceFor(course.color || '#3a7bd5');
            const headerText = textOnSurface();

            return (
              <Col key={course._id} md={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm course-card">
                  <Card.Header
                    className="course-card__header"
                    style={{ backgroundColor: headerBg, color: headerText }}
                  >
                    <h2 className="h6 mb-0 course-card__name" style={{ color: headerText }}>
                      {course.name}
                    </h2>
                    <div className="course-card__controls">
                      <Button
                        variant="light"
                        size="sm"
                        className="text-secondary"
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
                        onClick={() => handleDelete(course)}
                        title={`Elimina ${course.name}`}
                        aria-label={`Elimina il corso ${course.name}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </Button>
                    </div>
                  </Card.Header>

                  <Card.Body className="d-flex flex-column">
                    <dl className="course-card__meta">
                      <div>
                        <dt>Professore</dt>
                        <dd>{course.professor || '—'}</dd>
                      </div>
                      <div>
                        <dt>CFU</dt>
                        <dd>{course.credits || '—'}</dd>
                      </div>
                    </dl>

                    {course.description && (
                      <p className="course-card__description">{course.description}</p>
                    )}

                    {/* Syllabus status: the card's most useful line. */}
                    <div className="course-card__syllabus">
                      {total > 0 ? (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold">Programma</span>
                            <Badge bg="light" text="dark">
                              {completed}/{total} argomenti
                            </Badge>
                          </div>
                          <div
                            className="progress"
                            style={{ height: '8px' }}
                            role="progressbar"
                            aria-label={`Avanzamento del programma di ${course.name}`}
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="progress-bar"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: course.color || '#3a7bd5',
                              }}
                            />
                          </div>
                          <div className="small text-body-secondary mt-1">{percent}% completato</div>
                        </>
                      ) : (
                        <div className="course-card__no-syllabus">
                          <p className="small text-body-secondary mb-2">
                            Nessun programma importato.
                          </p>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-100"
                            onClick={() => openImport(course)}
                          >
                            <FaClipboardList className="me-2" aria-hidden="true" />
                            Incolla il programma
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3">
                      <Link to={`/courses/${course._id}`} className="btn btn-primary w-100">
                        Apri il corso
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── Create / edit course ──────────────────────────────────────────── */}
      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        centered
        scrollable
        aria-labelledby="titolo-form-corso"
      >
        <Modal.Header closeButton closeLabel="Chiudi">
          <Modal.Title id="titolo-form-corso" className="h5 mb-0">
            {editMode ? 'Modifica corso' : 'Nuovo corso'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="corso-nome">
              <Form.Label>Nome del corso</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentCourse.name}
                onChange={handleInputChange}
                placeholder="Es: Analisi Matematica II"
                required
                autoFocus
              />
            </Form.Group>

            <Row>
              <Col sm={7}>
                <Form.Group className="mb-3" controlId="corso-professore">
                  <Form.Label>Professore <span className="field-optional">(facoltativo)</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="professor"
                    value={currentCourse.professor}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col sm={5}>
                <Form.Group className="mb-3" controlId="corso-cfu">
                  <Form.Label>CFU <span className="field-optional">(facoltativo)</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="credits"
                    min="0"
                    value={currentCourse.credits}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="corso-descrizione">
              <Form.Label>Descrizione <span className="field-optional">(facoltativo)</span></Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={currentCourse.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="corso-colore">
              <Form.Label>Colore <span className="field-optional">(facoltativo)</span></Form.Label>
              <Form.Control
                type="color"
                name="color"
                className="course-color-input"
                value={currentCourse.color}
                onChange={handleInputChange}
              />
              <Form.Text className="text-body-secondary">
                Usato per riconoscere il corso nel calendario e nelle statistiche.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="flex-wrap gap-2 justify-content-end">
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
              Annulla
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? 'Salva modifiche' : 'Crea corso'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Syllabus import ───────────────────────────────────────────────── */}
      <SyllabusImportModal
        show={importTarget !== null}
        onHide={() => setImportTarget(null)}
        courseId={importTarget?._id}
        courseName={importTarget?.name}
        successNote={
          importIsPostCreate
            ? 'Corso creato. Vuoi incollare subito il programma? Puoi anche farlo più tardi: chiudi pure questa finestra.'
            : undefined
        }
        onImported={() => fetchCourses()}
      />
    </Container>
  );
}

export default Courses;
