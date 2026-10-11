import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import './PomodoroTimer.css';
import { api } from '../services/api';

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', minutes: 25 },
  { key: 'shortBreak', label: 'Pausa breve', minutes: 5 },
  { key: 'longBreak', label: 'Pausa lunga', minutes: 15 },
];

const durationFor = (mode) => (MODES.find((m) => m.key === mode)?.minutes ?? 25) * 60;

function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Fetch courses
    api
      .get('/api/courses')
      .then((response) => response.json())
      .then((data) => {
        setCourses(data);
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
      });

    // Setup audio for timer completion
    audioRef.current = new Audio('/notification-sound.mp3');

    return () => {
      // Clean up timer when component unmounts
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset timer when mode changes
    setTimeLeft(durationFor(mode));

    // Stop timer when mode changes
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [mode]);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer complete
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsRunning(false);

            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play().catch((e) => console.log('Error playing audio:', e));
            }

            // If pomodoro completed, show completion modal
            if (mode === 'pomodoro') {
              setCompletedPomodoros((prev) => prev + 1);
              setShowCompletionModal(true);

              // After 4 pomodoros, suggest a long break
              if ((completedPomodoros + 1) % 4 === 0) {
                setMode('longBreak');
              } else {
                setMode('shortBreak');
              }
            } else {
              // If break completed, switch to pomodoro
              setMode('pomodoro');
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (isRunning) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(durationFor(mode));
  };

  const saveSession = () => {
    if (!selectedCourse) {
      // Was a window.alert(): a blocking native dialog that screen readers
      // announce out of context and that cannot be styled or dismissed with
      // the keyboard in a predictable way.
      setSaveError('Seleziona un corso prima di salvare la sessione.');
      return;
    }

    const sessionData = {
      course: selectedCourse,
      date: new Date(),
      duration: 25, // Standard pomodoro is 25 minutes
      topic: selectedTopic || 'Sessione Pomodoro',
      notes: `Pomodoro completato (#${completedPomodoros})`,
    };

    api
      .post('/api/study-sessions', sessionData)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setSessions([...sessions, data]);
        setSaveError(null);
        setShowCompletionModal(false);
      })
      .catch((error) => {
        console.error('Error saving session:', error);
        setSaveError('Errore durante il salvataggio della sessione.');
      });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const spokenTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins} minuti e ${secs} secondi rimanenti`;
  };

  return (
    <div className="pomodoro-container">
      <div className="container">
        <h1 className="pomodoro-title h2">Timer Pomodoro</h1>

        <div className="pomodoro-card">
          <div className="mode-selector" role="group" aria-label="Tipo di intervallo">
            {MODES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`mode-button ${mode === key ? 'active' : ''}`}
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/*
            role="timer" with aria-live="off": the value is available on
            demand but is not announced every second, which would make the
            page unusable with a screen reader.
          */}
          <div className="timer-display" role="timer" aria-live="off" aria-label={spokenTime()}>
            {formatTime(timeLeft)}
          </div>

          <div className="timer-controls">
            <button
              type="button"
              className={`control-button ${isRunning ? 'pause' : 'start'}`}
              onClick={isRunning ? pauseTimer : startTimer}
            >
              {isRunning ? 'PAUSA' : 'INIZIA'}
            </button>
            <button type="button" className="control-button reset" onClick={resetTimer}>
              RESET
            </button>
          </div>

          <div className="session-info">
            <h2 className="h6">Informazioni sessione</h2>

            <div className="form-group">
              <label htmlFor="pomodoro-corso">Corso</label>
              <select
                id="pomodoro-corso"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSaveError(null);
                }}
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
              <label htmlFor="pomodoro-argomento">Argomento <span className="field-optional">(facoltativo)</span></label>
              <input
                id="pomodoro-argomento"
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Cosa stai studiando?"
                className="form-control"
              />
            </div>

            {saveError && !showCompletionModal && (
              <Alert variant="danger" className="mb-0" role="alert">
                {saveError}
              </Alert>
            )}
          </div>

          <div className="pomodoro-stats">
            <div className="stat">
              <span className="stat-number">{completedPomodoros}</span>
              <span className="stat-label">Pomodori completati</span>
            </div>
            <div className="stat">
              <span className="stat-number">{completedPomodoros * 25}</span>
              <span className="stat-label">Minuti totali</span>
            </div>
          </div>
        </div>

        {/*
          react-bootstrap's Modal instead of a hand-rolled overlay div: it
          traps focus, restores it on close, closes on Escape and exposes
          role="dialog" / aria-modal, none of which the previous markup did.
        */}
        <Modal
          show={showCompletionModal}
          onHide={() => setShowCompletionModal(false)}
          centered
          aria-labelledby="titolo-pomodoro-completato"
        >
          <Modal.Header closeButton closeLabel="Chiudi">
            <Modal.Title id="titolo-pomodoro-completato" className="h5 mb-0">
              Pomodoro completato!
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Hai completato con successo un pomodoro di 25 minuti.</p>
            <p className="mb-0">Vuoi salvare questa sessione di studio?</p>
            {saveError && (
              <Alert variant="danger" className="mt-3 mb-0" role="alert">
                {saveError}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2 justify-content-center">
            <Button variant="outline-secondary" onClick={() => setShowCompletionModal(false)}>
              Non salvare
            </Button>
            <Button variant="primary" onClick={saveSession}>
              Salva sessione
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default PomodoroTimer;
