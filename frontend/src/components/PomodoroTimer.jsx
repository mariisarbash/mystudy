import React, { useState, useEffect, useRef } from 'react';
import './PomodoroTimer.css';
import { api } from '../services/api';

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
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    // Fetch courses
    api.get('/api/courses')
      .then(response => response.json())
      .then(data => {
        setCourses(data);
      })
      .catch(error => {
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
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(25 * 60);
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60);
        break;
      case 'longBreak':
        setTimeLeft(15 * 60);
        break;
      default:
        setTimeLeft(25 * 60);
    }
    
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
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer complete
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsRunning(false);
            
            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Error playing audio:', e));
            }
            
            // If pomodoro completed, show completion modal
            if (mode === 'pomodoro') {
              setCompletedPomodoros(prev => prev + 1);
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
    
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(25 * 60);
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60);
        break;
      case 'longBreak':
        setTimeLeft(15 * 60);
        break;
      default:
        setTimeLeft(25 * 60);
    }
  };
  
  const saveSession = () => {
    if (!selectedCourse) {
      alert('Seleziona un corso prima di salvare la sessione.');
      return;
    }
    
    const sessionData = {
      course: selectedCourse,
      date: new Date(),
      duration: 25, // Standard pomodoro is 25 minutes
      topic: selectedTopic || 'Sessione Pomodoro',
      notes: `Pomodoro completato (#${completedPomodoros})`
    };
    
    api.post('/api/study-sessions', sessionData)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setSessions([...sessions, data]);
        setShowCompletionModal(false);
      })
      .catch(error => {
        console.error('Error saving session:', error);
        alert('Errore durante il salvataggio della sessione.');
      });
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="pomodoro-container">
      <div className="container">
        <h2 className="pomodoro-title">Pomodoro Timer</h2>
        
        <div className="pomodoro-card">
          <div className="mode-selector">
            <button 
              className={`mode-button ${mode === 'pomodoro' ? 'active' : ''}`}
              onClick={() => setMode('pomodoro')}
            >
              Pomodoro
            </button>
            <button 
              className={`mode-button ${mode === 'shortBreak' ? 'active' : ''}`}
              onClick={() => setMode('shortBreak')}
            >
              Pausa breve
            </button>
            <button 
              className={`mode-button ${mode === 'longBreak' ? 'active' : ''}`}
              onClick={() => setMode('longBreak')}
            >
              Pausa lunga
            </button>
          </div>
          
          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>
          
          <div className="timer-controls">
            <button 
              className={`control-button ${isRunning ? 'pause' : 'start'}`}
              onClick={isRunning ? pauseTimer : startTimer}
            >
              {isRunning ? 'PAUSA' : 'INIZIA'}
            </button>
            <button 
              className="control-button reset"
              onClick={resetTimer}
            >
              RESET
            </button>
          </div>
          
          <div className="session-info">
            <h3>Informazioni Sessione</h3>
            
            <div className="form-group">
              <label>Corso</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
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
              <label>Argomento</label>
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Cosa stai studiando?"
                className="form-control"
              />
            </div>
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
        
        {showCompletionModal && (
          <div className="completion-modal-overlay">
            <div className="completion-modal">
              <h3>Pomodoro Completato!</h3>
              <p>Hai completato con successo un pomodoro di 25 minuti.</p>
              <p>Vuoi salvare questa sessione di studio?</p>
              
              <div className="modal-buttons">
                <button className="btn btn-secondary" onClick={() => setShowCompletionModal(false)}>
                  Non salvare
                </button>
                <button className="btn btn-primary" onClick={saveSession}>
                  Salva sessione
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PomodoroTimer;