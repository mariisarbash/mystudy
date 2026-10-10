import React, { useState, useEffect } from 'react';
import axios from '../services/api';  // Importa il file axios configurato
import { 
  Card, Button, Form, ListGroup, 
  Spinner, Alert, Modal, Row, Col 
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaUpload } from 'react-icons/fa';

// Prova
const TopicsList = ({ courseId }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [currentTopic, setCurrentTopic] = useState({
    title: '',
    parentId: null,
    order: 0
  });
  const [programText, setProgramText] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/topics/course/${courseId}`);
      setTopics(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento degli argomenti');
      setLoading(false);
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTopic({ ...currentTopic, [name]: value });
  };

  const resetForm = () => {
    setCurrentTopic({
      title: '',
      parentId: null,
      order: 0
    });
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
      setError('Errore nel salvare l\'argomento');
      console.error(err);
    }
  };

  const handleImportProgram = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`/api/topics/course/${courseId}/generate`, { programText });
      fetchTopics();
      setShowImportForm(false);
      setProgramText('');
    } catch (err) {
      setError('Errore nell\'importazione del programma');
      console.error(err);
    }
  };

  const handleEdit = (topic) => {
    setCurrentTopic(topic);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo argomento?')) {
      try {
        await axios.delete(`/api/topics/${id}/course/${courseId}`);
        fetchTopics();
      } catch (err) {
        setError('Errore nell\'eliminazione dell\'argomento');
        console.error(err);
      }
    }
  };

  const toggleCompletion = async (topic) => {
    try {
      await axios.put(`/api/topics/${topic._id}`, {
        ...topic,
        completed: !topic.completed
      });
      
      fetchTopics();
    } catch (err) {
      setError('Errore nell\'aggiornamento dell\'argomento');
      console.error(err);
    }
  };

  // Organizza gli argomenti in una struttura gerarchica
  const organizeTopics = (topics) => {
    const topicsMap = {};
    const rootTopics = [];
    
    // Prima creiamo una mappa di tutti gli argomenti
    topics.forEach(topic => {
      topicsMap[topic._id] = { ...topic, children: [] };
    });
    
    // Poi costruiamo la gerarchia
    topics.forEach(topic => {
      if (topic.parentId && topicsMap[topic.parentId]) {
        topicsMap[topic.parentId].children.push(topicsMap[topic._id]);
      } else {
        rootTopics.push(topicsMap[topic._id]);
      }
    });
    
    // Ordinamento per campo 'order'
    rootTopics.sort((a, b) => a.order - b.order);
    
    return rootTopics;
  };

  // Renderizza un topic e i suoi figli ricorsivamente
  const renderTopic = (topic, level = 0) => {
    return (
      <React.Fragment key={topic._id}>
        <ListGroup.Item 
          className="d-flex align-items-center"
          style={{ paddingLeft: `${level * 20 + 15}px` }}
        >
          <div 
            className="me-3" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleCompletion(topic)}
          >
            <div 
              className={`rounded-circle border d-flex align-items-center justify-content-center ${topic.completed ? 'bg-success text-white' : ''}`}
              style={{ width: '24px', height: '24px', borderWidth: '2px' }}
            >
              {topic.completed && <FaCheck size={12} />}
            </div>
          </div>
          
          <div className="flex-grow-1">
            <div className={`${topic.completed ? 'text-decoration-line-through text-muted' : ''}`}>
              {topic.title}
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="me-2"
              onClick={() => handleEdit(topic)}
            >
              <FaEdit />
            </Button>
            
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => handleDelete(topic._id)}
            >
              <FaTrash />
            </Button>
          </div>
        </ListGroup.Item>
        
        {/* Renderizza ricorsivamente i figli */}
        {topic.children.sort((a, b) => a.order - b.order).map(child => 
          renderTopic(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  if (loading && topics.length === 0) {
    return <Spinner animation="border" size="sm" />;
  }

  // Organizza gli argomenti in una struttura gerarchica per la visualizzazione
  const organizedTopics = organizeTopics(topics);
  
  // Calcola il progresso complessivo
  const completedTopics = topics.filter(topic => topic.completed).length;
  const progressPercentage = topics.length > 0 
    ? Math.round((completedTopics / topics.length) * 100) 
    : 0;

  return (
    <div className="mb-5">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Statistiche Programma</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="text-center mb-3 mb-md-0">
              <h2>{topics.length}</h2>
              <div className="text-muted">Argomenti totali</div>
            </Col>
            <Col md={6} className="text-center">
              <h2>{completedTopics}</h2>
              <div className="text-muted">Argomenti completati</div>
            </Col>
          </Row>
          
          <div className="progress mt-4">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: '#3a7bd5'
              }} 
              aria-valuenow={progressPercentage} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {progressPercentage}%
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Programma</h3>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => setShowImportForm(true)}
          >
            <FaUpload /> Importa Programma
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <FaPlus /> Aggiungi Argomento
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {topics.length === 0 ? (
        <Alert variant="info">
          Non ci sono argomenti per questo corso. Aggiungi il tuo primo argomento o importa il programma completo!
        </Alert>
      ) : (
        <ListGroup>
          {organizedTopics.map(topic => renderTopic(topic))}
        </ListGroup>
      )}
      
      {/* Modal per aggiungere/modificare un argomento */}
      <Modal show={showForm} onHide={() => setShowForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Modifica' : 'Aggiungi'} Argomento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Titolo</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentTopic.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Argomento Principale (opzionale)</Form.Label>
              <Form.Select
                name="parentId"
                value={currentTopic.parentId || ''}
                onChange={handleInputChange}
              >
                <option value="">Nessuno (argomento principale)</option>
                {topics.map(topic => (
                  <option key={topic._id} value={topic._id}>
                    {topic.title}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Seleziona un argomento principale se questo è un sotto-argomento.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Ordine</Form.Label>
              <Form.Control
                type="number"
                name="order"
                value={currentTopic.order}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                L'ordine determina la posizione dell'argomento nell'elenco.
              </Form.Text>
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
      
      {/* Modal per importare il programma */}
      <Modal show={showImportForm} onHide={() => setShowImportForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Importa Programma</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Incolla qui il testo del programma del corso. Il sistema proverà a organizzarlo in argomenti.
          </p>
          <Form onSubmit={handleImportProgram}>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                value={programText}
                onChange={(e) => setProgramText(e.target.value)}
                rows={10}
                placeholder="Esempio:
                
1. Introduzione alla materia
2. Concetti fondamentali
   2.1 Teoria principale
   2.2 Applicazioni pratiche
3. Argomenti avanzati"
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowImportForm(false)}
                className="me-2"
              >
                Annulla
              </Button>
              <Button variant="primary" type="submit">
                Importa
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TopicsList;