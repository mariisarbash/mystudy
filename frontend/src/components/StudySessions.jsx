import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaRegClock } from 'react-icons/fa';
import './studySessions.css';
import { api } from '../services/api';
import { courseOf } from '../utils/sessions';

const emptySession = () => ({
  course: '',
  date: new Date().toISOString().split('T')[0],
  time: '12:00',
  duration: 60,
  topic: '',
  notes: '',
});

function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSession, setNewSession] = useState(emptySession);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api
      .get('/api/study-sessions')
      .then((response) => {
        if (!response.ok) throw new Error(`Errore ${response.status}: ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Errore nel caricamento delle sessioni di studio');
        setLoading(false);
      });

    api
      .get('/api/courses')
      .then((response) => {
        if (!response.ok) throw new Error(`Errore ${response.status}: ${response.statusText}`);
        return response.json();
      })
      .then(setCourses)
      .catch((err) => console.error('Errore nel caricamento dei corsi:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession({ ...newSession, [name]: value });
  };

  const handleAddSession = (e) => {
    e.preventDefault();

    const dateTime = new Date(`${newSession.date}T${newSession.time}`);

    const sessionData = {
      course: newSession.course,
      date: dateTime,
      duration: parseInt(newSession.duration, 10),
      topic: newSession.topic,
      notes: newSession.notes,
    };

    api
      .post('/api/study-sessions', sessionData)
      .then((response) => {
        if (!response.ok) throw new Error('Errore durante il salvataggio della sessione');
        return response.json();
      })
      .then((data) => {
        setSessions([...sessions, data]);
        setNewSession(emptySession());
        setShowForm(false);
        setError(null);
      })
      .catch((err) => setError(err.message));
  };

  const handleDeleteSession = (session) => {
    const label = session.topic || 'questa sessione';
    if (!window.confirm(`Eliminare "${label}"?`)) return;

    api
      .delete(`/api/study-sessions/${session._id}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Errore ${response.status}: ${response.statusText}`);
        setSessions(sessions.filter((s) => s._id !== session._id));
      })
      .catch((err) => setError(err.message));
  };

  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.date).toISOString().split('T')[0];
    (groups[date] ||= []).push(session);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Caricamento sessioni di studio…</p>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="container">
        <div className="sessions-header">
          <h1 className="h2 mb-0">Le mie sessioni di studio</h1>
          <button
            type="button"
            className="btn btn-primary"
            aria-expanded={showForm}
            aria-controls="form-nuova-sessione"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annulla' : 'Nuova sessione'}
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {showForm && (
          <div className="card add-session-form" id="form-nuova-sessione">
            <h2 className="h5">Aggiungi una sessione di studio</h2>
            {/*
              Neutral wording on purpose. The StudySession schema has no
              "completed" flag, so a record is only distinguished as planned
              or done by its date. "Pianifica" asserted one of the two; this
              hint states the actual behaviour instead. See the Phase 2B.1
              report for the underlying product question.
            */}
            <p className="form-hint">
              Usa una data passata per annotare uno studio già fatto, oppure una data
              futura per fissare una sessione.
            </p>
            <form onSubmit={handleAddSession}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sessione-corso">Corso</label>
                  <select
                    id="sessione-corso"
                    name="course"
                    value={newSession.course}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  >
                    <option value="">Seleziona un corso</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sessione-data">Data</label>
                  <input
                    id="sessione-data"
                    type="date"
                    name="date"
                    value={newSession.date}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sessione-ora">Ora</label>
                  <input
                    id="sessione-ora"
                    type="time"
                    name="time"
                    value={newSession.time}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sessione-durata">Durata (minuti)</label>
                  <input
                    id="sessione-durata"
                    type="number"
                    name="duration"
                    value={newSession.duration}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group form-group-wide">
                  <label htmlFor="sessione-argomento">Argomento <span className="field-optional">(facoltativo)</span></label>
                  <input
                    id="sessione-argomento"
                    type="text"
                    name="topic"
                    value={newSession.topic}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Es: Ripasso integrali doppi"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sessione-note">Note <span className="field-optional">(facoltativo)</span></label>
                <textarea
                  id="sessione-note"
                  name="notes"
                  value={newSession.notes}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Salva sessione
              </button>
            </form>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <FaRegClock size={26} />
            </span>
            <h2 className="empty-state__title">Nessuna sessione di studio</h2>
            <p className="empty-state__text">
              Una sessione tiene traccia di quanto tempo dedichi a un corso. Puoi annotare
              una sessione già svolta oppure fissarne una per i prossimi giorni: la trovi
              poi nel calendario e nelle statistiche.
            </p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
              Aggiungi la tua prima sessione
            </button>
            <p className="empty-state__aside">
              Vuoi invece organizzare <em>cosa</em> studiare?{' '}
              <Link to="/courses" className="link-highlight">
                Parti dal programma di un corso
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="sessions-timeline">
            {sortedDates.map((date) => (
              <div key={date} className="date-group">
                <h2 className="date-header h6">{formatDate(date)}</h2>

                <div className="sessions-list">
                  {groupedSessions[date].map((session) => {
                    // A session created in this page comes back from POST
                    // unpopulated (course is just an id), so resolve it
                    // against the loaded course list instead of showing
                    // "Corso non specificato" until the next reload.
                    const course = courseOf(session, courses);
                    return (
                      <div key={session._id} className="session-card">
                        <div className="session-time">
                          {new Date(session.date).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div
                          className="session-color-indicator"
                          style={{ backgroundColor: course?.color || '#ccc' }}
                          aria-hidden="true"
                        />
                        <div className="session-content">
                          <h3 className="session-title">{session.topic || 'Sessione di studio'}</h3>
                          <p className="session-course">{course?.name || 'Corso non specificato'}</p>
                          <p className="session-duration">{session.duration} minuti</p>
                          {session.notes && <p className="session-notes">{session.notes}</p>}
                        </div>
                        <div className="session-actions">
                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteSession(session)}
                            title="Elimina sessione"
                            aria-label={`Elimina la sessione ${session.topic || 'di studio'} del ${formatDate(date)}`}
                          >
                            <FaTrash aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudySessions;
