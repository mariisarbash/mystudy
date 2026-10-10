import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { Container, Button, Nav, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaGraduationCap, FaCalendarAlt } from 'react-icons/fa';

// Components
import LessonsList from './LessonsList';
import TopicsList from './TopicsList';
import './CourseDetail.css'; 

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/courses/${id}`);
        setCourse(response.data);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento del corso');
        setLoading(false);
        console.error(err);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <Container className="my-5 d-flex justify-content-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Corso non trovato</Alert>
      </Container>
    );
  }

  return (
    <Container className="course-detail-container">
      <Button 
        variant="link" 
        className="back-button p-0"
        onClick={() => navigate('/courses')}
      >
        <FaArrowLeft size={14} /> Torna ai corsi
      </Button>
      
      <div 
        className="course-header" 
        style={{ backgroundColor: course.color || '#3a7bd5' }}
      >
        <h2>{course.name}</h2>
        <div className="course-meta">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center">
              <FaUser className="me-2" /> 
              <span>Prof. {course.professor}</span>
            </div>
            <div className="d-flex align-items-center">
              <FaGraduationCap className="me-2" /> 
              <span>{course.credits} CFU</span>
            </div>
            {course.startDate && (
              <div className="d-flex align-items-center">
                <FaCalendarAlt className="me-2" /> 
                <span>{new Date(course.startDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="lessons">Lezioni</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="topics">Programma</Nav.Link>
        </Nav.Item>
      </Nav>
      
      {activeTab === 'lessons' ? (
        <LessonsList courseId={id} />
      ) : (
        <TopicsList courseId={id} />
      )}
    </Container>
  );
};

export default CourseDetail;