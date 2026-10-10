import React, { useState, useEffect } from 'react';
import './studySessions.css';
import { api } from '../services/api';

function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSession, setNewSession] = useState({
    course: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    duration: 60,
    topic: '',
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Fetch sessions
    api.get('/api/study-sessions')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(error => {
        setError('Errore nel caricamento delle sessioni di studio');
        setLoading(false);
      });
    
    // Fetch courses
    api.get('/api/courses')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setCourses(data);
      })
      .catch(error => {
        console.error('Errore nel caricamento dei corsi:', error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession({
      ...newSession,
      [name]: value
    });
  };

  const handleAddSession = (e) => {
    e.preventDefault();
    
    // Combine date and time
    const dateTime = new Date(newSession.date + 'T' + newSession.time);
    
    const sessionData = {
      course: newSession.course,
      date: dateTime,
      duration: parseInt(newSession.duration),
      topic: newSession.topic,
      notes: newSession.notes
    };

    api.post('/api/study-sessions', sessionData)
      .then(response => {
        if (!response.ok) {
          throw new Error('Errore durante il salvataggio della sessione');
        }
        return response.json();
      })
      .then(data => {
        setSessions([...sessions, data]);
        setNewSession({
          course: '',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          duration: 60,
          topic: '',
          notes: ''
        });
        setShowForm(false);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  const handleDeleteSession = (id) => {
    api.delete(`/api/study-sessions/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
        setSessions(sessions.filter(session => session._id !== id));
      })
      .catch(error => {
        setError(error.message);
      });
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a));

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  if (loading) return <div className="loading">Caricamento sessioni di studio...</div>;

  return (
    <div className="sessions-container">
      <div className="container">
        <div className="sessions-header">
          <h2>Le mie sessioni di studio</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annulla' : 'Nuova sessione'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <div className="card add-session-form">
            <h3>Pianifica una nuova sessione</h3>
            <form onSubmit={handleAddSession}>
              <div className="form-row">
                <div className="form-group">
                  <label>Corso</label>
                  <select 
                    name="course" 
                    value={newSession.course} 
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  >
                    <option value="">Seleziona un corso</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={newSession.date} 
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Ora</label>
                  <input 
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
                  <label>Durata (minuti)</label>
                  <input 
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
                  <label>Argomento</label>
                  <input 
                    type="text" 
                    name="topic" 
                    value={newSession.topic} 
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Note</label>
                <textarea 
                  name="notes" 
                  value={newSession.notes} 
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                Pianifica sessione
              </button>
            </form>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>Non hai ancora registrato sessioni di studio.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Pianifica la tua prima sessione
            </button>
          </div>
        ) : (
          <div className="sessions-timeline">
            {sortedDates.map(date => (
              <div key={date} className="date-group">
                <h3 className="date-header">{formatDate(date)}</h3>
                
                <div className="sessions-list">
                  {groupedSessions[date].map(session => (
                    <div key={session._id} className="session-card">
                      <div className="session-time">
                        {new Date(session.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div 
                        className="session-color-indicator"
                        style={{ backgroundColor: session.course?.color || '#ccc' }}
                      ></div>
                      <div className="session-content">
                        <h4 className="session-title">
                          {session.topic || 'Sessione di studio'}
                        </h4>
                        <p className="session-course">
                          {session.course?.name || 'Corso non specificato'}
                        </p>
                        <p className="session-duration">
                          {session.duration} minuti
                        </p>
                        {session.notes && (
                          <p className="session-notes">{session.notes}</p>
                        )}
                      </div>
                      <div className="session-actions">
                        <button 
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteSession(session._id)}
                          aria-label="Elimina sessione"
                        >
                          <span role="img" aria-label="cestino">🗑️</span>
                        </button>
                      </div>
                    </div>
                  ))}
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