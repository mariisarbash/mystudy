import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { Container, Button, Nav, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaGraduationCap, FaCalendarAlt } from 'react-icons/fa';
import { surfaceFor, textOnSurface } from '../utils/color';

// Components
import LessonsList from './LessonsList';
import TopicsList from './TopicsList';
import './CourseDetail.css';

const TABS = [
  // Programma comes first and opens by default: the syllabus checklist is the
  // reason the course page exists. It used to be the second tab, behind
  // Lezioni, which buried the product's main flow.
  { key: 'topics', label: 'Programma' },
  { key: 'lessons', label: 'Lezioni' },
];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('topics');
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
          <span className="visually-hidden">Caricamento…</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
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

  // The course colour is user-chosen, so darken it as far as white text
  // needs to stay above the AA contrast minimum.
  const headerBg = surfaceFor(course.color || '#3a7bd5');
  const headerText = textOnSurface();

  return (
    <Container className="course-detail-container">
      <Button variant="link" className="back-button p-0" onClick={() => navigate('/courses')}>
        <FaArrowLeft size={14} aria-hidden="true" /> Torna ai corsi
      </Button>

      <div
        className="course-header"
        style={{ backgroundColor: headerBg, color: headerText }}
      >
        <h1 className="course-header__title" style={{ color: headerText }}>
          {course.name}
        </h1>
        <div className="course-meta">
          {course.professor && (
            <div className="course-meta__item">
              <FaUser aria-hidden="true" />
              <span>Prof. {course.professor}</span>
            </div>
          )}
          {course.credits && (
            <div className="course-meta__item">
              <FaGraduationCap aria-hidden="true" />
              <span>{course.credits} CFU</span>
            </div>
          )}
          {course.startDate && (
            <div className="course-meta__item">
              <FaCalendarAlt aria-hidden="true" />
              <span>{new Date(course.startDate).toLocaleDateString('it-IT')}</span>
            </div>
          )}
        </div>
      </div>

      <Nav variant="tabs" className="course-tabs" role="tablist">
        {TABS.map(({ key, label }) => (
          <Nav.Item key={key} as="div" role="presentation">
            <Nav.Link
              as="button"
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`pannello-${key}`}
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div
        id={`pannello-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="course-tabpanel"
      >
        {activeTab === 'topics' ? (
          <TopicsList courseId={id} courseName={course.name} />
        ) : (
          <LessonsList courseId={id} />
        )}
      </div>
    </Container>
  );
};

export default CourseDetail;
