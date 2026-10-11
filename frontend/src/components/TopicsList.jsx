import React, { useCallback, useEffect, useState } from 'react';
import axios from '../services/api';
import { Card, Button, Form, ListGroup, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaClipboardList } from 'react-icons/fa';
import SyllabusImportModal from './SyllabusImportModal';

/**
 * The syllabus checklist for one course.
 *
 * Import is no longer one button among several in a toolbar: when a course
 * has no topics yet the whole panel becomes a single clear call to action
 * explaining what pasting the syllabus will do.
 */
const TopicsList = ({ courseId, courseName }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [currentTopic, setCurrentTopic] = useState({ title: '', parentId: null, order: 0 });
  const [editMode, setEditMode] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/topics/course/${courseId}`);
      setTopics(response.data || []);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento degli argomenti');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTopic({ ...currentTopic, [name]: value });
  };

  const resetForm = () => {
    setCurrentTopic({ title: '', parentId: null, order: topics.length });
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await axios.put(`/api/topics/${currentTopic._id}`, currentTopic);
      } else {
        await axios.post(`/api/topics/course/${courseId}`, currentTopic);
      }

      fetchTopics();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError("Errore nel salvare l'argomento");
      console.error(err);
    }
  };

  const handleEdit = (topic) => {
    setCurrentTopic(topic);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (topic) => {
    if (window.confirm(`Eliminare l'argomento "${topic.title}"?`)) {
      try {
        await axios.delete(`/api/topics/${topic._id}/course/${courseId}`);
        fetchTopics();
      } catch (err) {
        setError("Errore nell'eliminazione dell'argomento");
        console.error(err);
      }
    }
  };

  const toggleCompletion = async (topic) => {
    try {
      // Send only the field that changes: the controller does a partial
      // findByIdAndUpdate, and the rendered topic object carries a `children`
      // array that has no business being written back.
      await axios.put(`/api/topics/${topic._id}`, { completed: !topic.completed });
      fetchTopics();
    } catch (err) {
      setError("Errore nell'aggiornamento dell'argomento");
      console.error(err);
    }
  };

  // Organise topics into a hierarchy (the schema allows a parentId; the
  // importer never sets one, but a manually added topic can).
  const organizeTopics = (list) => {
    const map = {};
    const roots = [];

    list.forEach((topic) => {
      map[topic._id] = { ...topic, children: [] };
    });

    list.forEach((topic) => {
      if (topic.parentId && map[topic.parentId]) {
        map[topic.parentId].children.push(map[topic._id]);
      } else {
        roots.push(map[topic._id]);
      }
    });

    roots.sort((a, b) => a.order - b.order);
    return roots;
  };

  const renderTopic = (topic, level = 0) => (
    <React.Fragment key={topic._id}>
      <ListGroup.Item className={topic.completed ? 'is-done' : undefined}>
        <div className="item-row" style={{ paddingLeft: `${level * 20}px` }}>
          <div className="item-main">
            <button
              type="button"
              className="toggle-done"
              aria-pressed={topic.completed === true}
              aria-label={
                topic.completed
                  ? `Segna "${topic.title}" come da studiare`
                  : `Segna "${topic.title}" come completato`
              }
              onClick={() => toggleCompletion(topic)}
            >
              <FaCheck size={12} aria-hidden="true" />
            </button>

            <div className="item-body">
              <p className="item-title">{topic.title}</p>
            </div>
          </div>

          <div className="item-controls">
            <Button
              variant="outline-secondary"
              size="sm"
              className="icon-button"
              onClick={() => handleEdit(topic)}
              title={`Modifica "${topic.title}"`}
              aria-label={`Modifica l'argomento ${topic.title}`}
            >
              <FaEdit aria-hidden="true" />
            </Button>

            <Button
              variant="outline-danger"
              size="sm"
              className="icon-button"
              onClick={() => handleDelete(topic)}
              title={`Elimina "${topic.title}"`}
              aria-label={`Elimina l'argomento ${topic.title}`}
            >
              <FaTrash aria-hidden="true" />
            </Button>
          </div>
        </div>
      </ListGroup.Item>

      {topic.children
        .sort((a, b) => a.order - b.order)
        .map((child) => renderTopic(child, level + 1))}
    </React.Fragment>
  );

  const renderTopicForm = () => (
    <Modal
      show={showForm}
      onHide={() => setShowForm(false)}
      centered
      scrollable
      aria-labelledby="titolo-form-argomento"
    >
      <Modal.Header closeButton closeLabel="Chiudi">
        <Modal.Title id="titolo-form-argomento" className="h5 mb-0">
          {editMode ? 'Modifica argomento' : 'Nuovo argomento'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="argomento-titolo">
            <Form.Label>Titolo</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={currentTopic.title}
              onChange={handleInputChange}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="argomento-padre">
            <Form.Label>Argomento principale (facoltativo)</Form.Label>
            <Form.Select
              name="parentId"
              value={currentTopic.parentId || ''}
              onChange={handleInputChange}
            >
              <option value="">Nessuno (argomento principale)</option>
              {topics
                .filter((t) => t._id !== currentTopic._id)
                .map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.title}
                  </option>
                ))}
            </Form.Select>
            <Form.Text className="text-body-secondary">
              Seleziona un argomento principale se questo è un sotto-argomento.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="argomento-ordine">
            <Form.Label>Ordine</Form.Label>
            <Form.Control
              type="number"
              name="order"
              value={currentTopic.order}
              onChange={handleInputChange}
            />
            <Form.Text className="text-body-secondary">
              Determina la posizione dell’argomento nell’elenco.
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="flex-wrap gap-2 justify-content-end">
          <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
            Annulla
          </Button>
          <Button variant="primary" type="submit">
            Salva
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  if (loading && topics.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Caricamento…</span>
        </Spinner>
      </div>
    );
  }

  const organizedTopics = organizeTopics(topics);
  const completedTopics = topics.filter((t) => t.completed).length;
  const progressPercentage = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

  // ── Empty state: the primary entry point into the product's main flow ──
  if (topics.length === 0) {
    return (
      <>
        {error && (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        )}

        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="text-center p-4 p-md-5">
            <span className="syllabus-cta__icon" aria-hidden="true">
              <FaClipboardList size={26} />
            </span>
            <h2 className="h4 mt-3">Inizia dal programma del corso</h2>
            <p className="text-body-secondary mx-auto mb-4" style={{ maxWidth: '46ch' }}>
              Copia il programma dal sito del corso e incollalo qui: ogni riga diventa un
              argomento da spuntare, così vedi subito quanto ti manca all’esame.
            </p>

            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <Button variant="primary" size="lg" onClick={() => setShowImportForm(true)}>
                <FaClipboardList className="me-2" aria-hidden="true" />
                Incolla il programma
              </Button>
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <FaPlus className="me-2" aria-hidden="true" />
                Aggiungi un argomento
              </Button>
            </div>
          </Card.Body>
        </Card>

        <SyllabusImportModal
          show={showImportForm}
          onHide={() => setShowImportForm(false)}
          courseId={courseId}
          courseName={courseName}
          onImported={() => fetchTopics()}
        />

        {renderTopicForm()}
      </>
    );
  }

  return (
    <div className="mb-5">
      <Card className="mb-4 shadow-sm stats-card">
        <Card.Header>
          <h2 className="h6 mb-0">Avanzamento del programma</h2>
        </Card.Header>
        <Card.Body>
          <Row className="text-center g-3">
            <Col xs={4}>
              <div className="stat-value">{topics.length}</div>
              <div className="text-body-secondary small">Argomenti</div>
            </Col>
            <Col xs={4}>
              <div className="stat-value">{completedTopics}</div>
              <div className="text-body-secondary small">Completati</div>
            </Col>
            <Col xs={4}>
              <div className="stat-value">{topics.length - completedTopics}</div>
              <div className="text-body-secondary small">Da studiare</div>
            </Col>
          </Row>

          <div
            className="progress"
            role="progressbar"
            aria-label="Avanzamento del programma"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-center small text-body-secondary mt-2 mb-0">
            {progressPercentage}% del programma completato
          </p>
        </Card.Body>
      </Card>

      <div className="section-header">
        <h2 className="h5 mb-0">Argomenti</h2>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary" onClick={() => setShowImportForm(true)}>
            <FaClipboardList className="me-2" aria-hidden="true" />
            Incolla altro programma
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <FaPlus className="me-2" aria-hidden="true" />
            Aggiungi argomento
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

      <ListGroup>{organizedTopics.map((topic) => renderTopic(topic))}</ListGroup>

      <SyllabusImportModal
        show={showImportForm}
        onHide={() => setShowImportForm(false)}
        courseId={courseId}
        courseName={courseName}
        onImported={() => fetchTopics()}
      />

      {renderTopicForm()}
    </div>
  );
};

export default TopicsList;
