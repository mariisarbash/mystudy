import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Button, Alert } from 'react-bootstrap';
import { FaClock, FaRegLightbulb, FaTint, FaClipboardList, FaPlus } from 'react-icons/fa';
import axios from '../services/api';
import Onboarding from './Onboarding';
import SyllabusImportModal from './SyllabusImportModal';
import { courseIdOf, courseOf, isRecorded, splitByTime, totalMinutes } from '../utils/sessions';
import './dashboard.css';

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  /** topicsByCourse: { [courseId]: { total, completed } } */
  const [topicsByCourse, setTopicsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importFor, setImportFor] = useState(null); // course object, or 'any'

  const load = useCallback(async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        axios.get('/api/courses'),
        axios.get('/api/study-sessions'),
      ]);
      const courseList = coursesRes.data || [];
      setCourses(courseList);
      setSessions(sessionsRes.data || []);

      // Syllabus progress is the headline number of this product, so the
      // dashboard reads the real topic lists rather than inferring progress
      // from study minutes. There is no aggregate endpoint and Phase 2B must
      // not add one, so this fans out over the (handful of) courses.
      const topicResults = await Promise.all(
        courseList.map((c) =>
          axios
            .get(`/api/topics/course/${c._id}`)
            .then((r) => [c._id, r.data || []])
            .catch(() => [c._id, []])
        )
      );
      setTopicsByCourse(
        Object.fromEntries(
          topicResults.map(([id, topics]) => [
            id,
            { total: topics.length, completed: topics.filter((t) => t.completed).length },
          ])
        )
      );
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento della dashboard:', err);
      setError('Non è stato possibile caricare i dati. Verifica che il server sia attivo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todaySessions = sessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= startOfToday && d < endOfToday;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingSessions = sessions
    .filter((s) => new Date(s.date) >= endOfToday)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const nameOfCourse = (session) => courseOf(session, courses)?.name || 'Corso non specificato';

  /*
    Study time counts past-dated sessions only. A study session carries no
    completion flag, so a session booked for next week used to be added to
    "tempo di studio" the moment it was saved, as if it had already happened.
    Planned time is reported separately, below the card.
  */
  const { recorded: recordedSessions, planned: plannedSessions } = splitByTime(sessions);
  const plannedMinutes = totalMinutes(plannedSessions);

  // `courseIdOf` is what makes this work at all: the API populates
  // `session.course` into an object, and the old `===` test against an id
  // string meant every course showed 0 minuti / 0 sessioni.
  const studyTime = courses
    .map((course) => {
      const own = recordedSessions.filter((s) => courseIdOf(s) === course._id);
      return {
        ...course,
        totalMinutes: totalMinutes(own),
        sessionsCount: own.length,
      };
    })
    .filter((c) => c.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const maxMinutes = studyTime.length ? studyTime[0].totalMinutes : 0;

  const syllabusProgress = courses.map((course) => {
    const { total = 0, completed = 0 } = topicsByCourse[course._id] || {};
    return {
      ...course,
      topicsTotal: total,
      topicsDone: completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const coursesWithoutSyllabus = syllabusProgress.filter((c) => c.topicsTotal === 0);

  const formatMinutes = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min} min`;
    return min === 0 ? `${h} h` : `${h} h ${min} min`;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Caricamento…</span>
          </Spinner>
          <p className="mt-3 text-body-secondary">Caricamento dashboard…</p>
        </div>
      </Container>
    );
  }

  // ── First run: no courses yet ──────────────────────────────────────────
  if (!error && courses.length === 0) {
    return (
      <Container className="dashboard-container py-4">
        <Onboarding />
      </Container>
    );
  }

  return (
    <Container className="dashboard-container py-4">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-actions">
          <Button variant="primary" onClick={() => setImportFor('any')}>
            <FaClipboardList className="me-2" aria-hidden="true" />
            Incolla un programma
          </Button>
          <Link to="/courses?nuovo=1" className="btn btn-outline-primary">
            <FaPlus className="me-2" aria-hidden="true" />
            Nuovo corso
          </Link>
          <Link to="/study-sessions" className="btn btn-outline-secondary">
            Nuova sessione
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

      {/* Nudge toward the core flow for any course that still has no syllabus. */}
      {coursesWithoutSyllabus.length > 0 && (
        <Alert variant="info" className="dashboard-nudge">
          <div>
            <strong>
              {coursesWithoutSyllabus.length === 1
                ? '1 corso non ha ancora un programma.'
                : `${coursesWithoutSyllabus.length} corsi non hanno ancora un programma.`}
            </strong>{' '}
            Incollalo per ottenere la lista degli argomenti da spuntare.
          </div>
          <Button
            variant="primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setImportFor(coursesWithoutSyllabus[0])}
          >
            Incolla il programma
          </Button>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h2 className="h6 m-0">Il tuo programma di oggi</h2>
            </Card.Header>
            <Card.Body className="p-0">
              {todaySessions.length > 0 ? (
                <div className="schedule-table">
                  <div className="schedule-header" aria-hidden="true">
                    <div className="schedule-cell">Ora</div>
                    <div className="schedule-cell">Materia</div>
                    <div className="schedule-cell">Durata</div>
                    <div className="schedule-cell">Stato</div>
                  </div>
                  {todaySessions.map((session) => (
                    <div className="schedule-row" key={session._id}>
                      {/* Each value is wrapped in a single element so that on
                          mobile, where the cell becomes a flex row with a
                          generated label, the whole value stays one item. */}
                      <div className="schedule-cell" data-label="Ora">
                        <span className="schedule-value">
                          {new Date(session.date).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="schedule-cell schedule-cell--subject" data-label="Materia">
                        <span className="schedule-value">
                          {nameOfCourse(session)}
                          {session.topic && (
                            <span className="schedule-topic"> — {session.topic}</span>
                          )}
                        </span>
                      </div>
                      <div className="schedule-cell" data-label="Durata">
                        <span className="schedule-value">{session.duration} min</span>
                      </div>
                      <div className="schedule-cell" data-label="Stato">
                        <span className="schedule-value">
                          {/* Today's list spans both halves of the day, so the
                              badge follows the clock rather than labelling an
                              8:00 slot "In programma" at six in the evening. */}
                          {isRecorded(session) ? (
                            <span className="status-badge recorded">Registrata</span>
                          ) : (
                            <span className="status-badge pending">In programma</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-schedule">
                  <p className="mb-2">Non hai sessioni programmate per oggi.</p>
                  <Link to="/study-sessions" className="link-highlight">
                    Pianifica una sessione
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <h2 className="h6 m-0">Prossimi impegni</h2>
              <Link to="/calendar" className="see-all-link">
                Vedi tutti
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingSessions.length > 0 ? (
                <div className="upcoming-list">
                  {upcomingSessions.map((session) => (
                    <div className="upcoming-item" key={session._id}>
                      <div className="upcoming-date" aria-hidden="true">
                        <span className="day">
                          {new Date(session.date).toLocaleDateString('it-IT', { day: 'numeric' })}
                        </span>
                        <span className="month">
                          {new Date(session.date).toLocaleDateString('it-IT', { month: 'short' })}
                        </span>
                      </div>
                      <div className="upcoming-details">
                        <h3 className="h6 mb-1">{session.topic || 'Sessione di studio'}</h3>
                        <div className="upcoming-info">
                          <span>
                            <FaClock className="me-1" size={12} aria-hidden="true" />
                            <span className="visually-hidden">Data e ora: </span>
                            {new Date(session.date).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                            })}
                            , {new Date(session.date).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>{nameOfCourse(session)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-upcoming">
                  <p className="mb-0">Non hai prossimi impegni programmati.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* The product's core metric: how much of each syllabus is done. */}
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h2 className="h6 m-0">Progresso del programma</h2>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="courses-progress">
                {syllabusProgress.map((course) =>
                  course.topicsTotal > 0 ? (
                    <Link
                      to={`/courses/${course._id}`}
                      key={course._id}
                      className="course-progress-item"
                    >
                      <h3 className="h6 mb-2">{course.name}</h3>
                      <div
                        className="progress mb-2"
                        style={{ height: '8px' }}
                        role="progressbar"
                        aria-label={`Avanzamento di ${course.name}`}
                        aria-valuenow={course.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="progress-bar"
                          style={{
                            width: `${course.percent}%`,
                            backgroundColor: course.color || '#3a7bd5',
                          }}
                        />
                      </div>
                      <div className="d-flex justify-content-between small text-body-secondary">
                        <span>
                          {course.topicsDone} di {course.topicsTotal} argomenti
                        </span>
                        <span>{course.percent}%</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="course-progress-item course-progress-item--empty" key={course._id}>
                      <h3 className="h6 mb-1">{course.name}</h3>
                      <p className="small text-body-secondary mb-2">
                        Nessun programma importato.
                      </p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setImportFor(course)}
                      >
                        Incolla il programma
                      </Button>
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h2 className="h6 m-0">Tempo registrato per corso</h2>
            </Card.Header>
            <Card.Body className="p-0">
              {studyTime.length > 0 ? (
                <div className="courses-progress">
                  {studyTime.map((course) => (
                    <div className="course-progress-item" key={course._id}>
                      <h3 className="h6 mb-2">{course.name}</h3>
                      {/* Bars are scaled against the most-studied course, so
                          they compare courses honestly instead of against an
                          invented target. */}
                      <div className="progress mb-2" style={{ height: '8px' }} aria-hidden="true">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${maxMinutes ? (course.totalMinutes / maxMinutes) * 100 : 0}%`,
                            backgroundColor: course.color || '#3a7bd5',
                          }}
                        />
                      </div>
                      <div className="d-flex justify-content-between small text-body-secondary">
                        <span>{formatMinutes(course.totalMinutes)}</span>
                        <span>
                          {course.sessionsCount}{' '}
                          {course.sessionsCount === 1 ? 'sessione' : 'sessioni'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-courses">
                  <p className="mb-2">
                    Non hai ancora sessioni con una data passata da registrare.
                  </p>
                  <Link to="/study-sessions" className="btn btn-sm btn-primary">
                    Registra una sessione
                  </Link>
                </div>
              )}
            </Card.Body>
            {plannedMinutes > 0 && (
              <Card.Footer className="card-footnote">
                In più hai {formatMinutes(plannedMinutes)} di studio pianificato in{' '}
                {plannedSessions.length === 1
                  ? '1 sessione futura'
                  : `${plannedSessions.length} sessioni future`}
                , non conteggiato qui sopra.
              </Card.Footer>
            )}
          </Card>

          {/*
            The previous version of this card announced "Pausa caffè —
            consigliata tra 25 minuti", a hardcoded countdown tied to nothing.
            These are plain study tips: true as written, with no invented state.
          */}
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h2 className="h6 m-0">Consigli di studio</h2>
            </Card.Header>
            <Card.Body>
              <div className="wellness-tips">
                <div className="wellness-tip">
                  <div className="wellness-icon coffee" aria-hidden="true">
                    <FaRegLightbulb size={20} />
                  </div>
                  <div className="wellness-content">
                    <h3 className="h6 mb-1">Studia a blocchi</h3>
                    <p className="mb-0">
                      Cicli da 25 minuti con pause brevi aiutano a mantenere la concentrazione.{' '}
                      <Link to="/pomodoro" className="link-highlight">
                        Usa il timer Pomodoro
                      </Link>
                      .
                    </p>
                  </div>
                </div>
                <div className="wellness-tip">
                  <div className="wellness-icon water" aria-hidden="true">
                    <FaTint size={20} />
                  </div>
                  <div className="wellness-content">
                    <h3 className="h6 mb-1">Idratazione</h3>
                    <p className="mb-0">Tieni una bottiglia d’acqua sulla scrivania.</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <SyllabusImportModal
        show={importFor !== null}
        onHide={() => setImportFor(null)}
        courseId={importFor && importFor !== 'any' ? importFor._id : undefined}
        courseName={importFor && importFor !== 'any' ? importFor.name : undefined}
        courses={courses}
        onImported={() => load()}
      />
    </Container>
  );
}

export default Dashboard;
