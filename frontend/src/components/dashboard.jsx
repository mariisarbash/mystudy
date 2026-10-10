import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaClock, FaCoffee, FaTint } from 'react-icons/fa';
import axios from '../services/api';
import './dashboard.css';

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch courses
    axios.get('/api/courses')
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching courses:', error);
        setLoading(false);
      });

    // Fetch study sessions
    axios.get('/api/study-sessions')
      .then(response => {
        setSessions(response.data);
      })
      .catch(error => {
        console.error('Error fetching sessions:', error);
      });
  }, []);
  
  // Sessioni di oggi 
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    return sessionDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  });

  // Sessioni future (prossimi impegni)
  const upcomingSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    return sessionDate > today;
  }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

  // Calcola progresso per corso
  const courseProgress = courses.map(course => {
    const courseSessions = sessions.filter(session => session.course === course._id);
    const totalMinutes = courseSessions.reduce((total, session) => total + (session.duration || 0), 0);
    return {
      ...course,
      totalMinutes,
      sessionsCount: courseSessions.length
    };
  }).sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 3);

  // Mostra spinner di caricamento
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
          <p className="mt-3 text-muted">Caricamento dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="dashboard-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="action-buttons">
          <Link to="/study-sessions" className="btn btn-primary me-2">
            <i className="me-2">+</i> Nuova Sessione
          </Link>
          <Link to="/courses" className="btn btn-outline-primary">
            <i className="me-2">+</i> Nuova Materia
          </Link>
        </div>
      </div>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h5 className="m-0">Il tuo programma di oggi</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {todaySessions.length > 0 ? (
                <div className="schedule-table">
                  <div className="schedule-header">
                    <div className="schedule-cell">Ora</div>
                    <div className="schedule-cell">Materia</div>
                    <div className="schedule-cell">Durata</div>
                    <div className="schedule-cell">Stato</div>
                  </div>
                  {todaySessions.map(session => (
                    <div className="schedule-row" key={session._id}>
                      <div className="schedule-cell">
                        {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="schedule-cell">
                        {session.course ? courses.find(c => c._id === session.course)?.name || 'Corso' : 'Corso non specificato'}
                      </div>
                      <div className="schedule-cell">
                        {session.duration} min
                      </div>
                      <div className="schedule-cell">
                        <span className="status-badge pending">In programma</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-schedule">
                  <p>Non hai sessioni programmate per oggi</p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="m-0">Prossimi impegni</h5>
              <Link to="/calendar" className="see-all-link">Vedi tutti</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingSessions.length > 0 ? (
                <div className="upcoming-list">
                  {upcomingSessions.map(session => (
                    <div className="upcoming-item" key={session._id}>
                      <div className="upcoming-date">
                        <span className="day">{new Date(session.date).toLocaleDateString([], {day: 'numeric'})}</span>
                        <span className="month">{new Date(session.date).toLocaleDateString([], {month: 'short'})}</span>
                      </div>
                      <div className="upcoming-details">
                        <h6>{session.topic || 'Sessione di studio'}</h6>
                        <div className="upcoming-info">
                          <span>
                            <FaClock className="me-1" size={12} />
                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>
                            {session.course ? courses.find(c => c._id === session.course)?.name || 'Corso' : 'Corso non specificato'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-upcoming">
                  <p>Non hai prossimi impegni programmati</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h5 className="m-0">Progresso materie</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {courseProgress.length > 0 ? (
                <div className="courses-progress">
                  {courseProgress.map(course => (
                    <Link to={`/courses/${course._id}`} key={course._id} className="course-progress-item">
                      <h6>{course.name}</h6>
                      <div className="progress mb-2" style={{height: '6px'}}>
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{
                            width: `${Math.min(course.totalMinutes / 500 * 100, 100)}%`,
                            backgroundColor: course.color || '#3a7bd5'
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between small text-muted">
                        <span>{course.totalMinutes} minuti</span>
                        <span>{course.sessionsCount} sessioni</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-courses">
                  <p>Aggiungi corsi per vedere i tuoi progressi</p>
                  <Link to="/courses" className="btn btn-sm btn-primary">
                    Aggiungi Corso
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h5 className="m-0">Benessere</h5>
            </Card.Header>
            <Card.Body>
              <div className="wellness-tips">
                <div className="wellness-tip">
                  <div className="wellness-icon coffee">
                    <FaCoffee size={20} />
                  </div>
                  <div className="wellness-content">
                    <h6>Pausa caffè</h6>
                    <p>Consigliata tra 25 minuti</p>
                  </div>
                </div>
                <div className="wellness-tip">
                  <div className="wellness-icon water">
                    <FaTint size={20} />
                  </div>
                  <div className="wellness-content">
                    <h6>Idratazione</h6>
                    <p>Ricordati di bere dell'acqua</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;