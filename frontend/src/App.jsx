import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/header';
import Dashboard from './components/dashboard';
import Courses from './components/courses';
import CourseDetail from './components/CourseDetail';
import StudySessions from './components/StudySessions';
import Calendar from './components/calendar';
import Statistics from './components/Statistics';
import PomodoroTimer from './components/PomodoroTimer';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Lets keyboard and screen-reader users jump past the six nav links. */}
        <a className="skip-link" href="#contenuto-principale">
          Vai al contenuto principale
        </a>
        <Header />
        <main id="contenuto-principale" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/study-sessions" element={<StudySessions />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/pomodoro" element={<PomodoroTimer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
