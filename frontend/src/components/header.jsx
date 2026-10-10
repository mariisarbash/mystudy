import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

function Header() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <FontAwesomeIcon icon={faGraduationCap} className="logo-icon" />
          <h1>UniAssistant</h1>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/courses" className={`nav-link ${isActive('/courses')}`}>
                Corsi
              </Link>
            </li>
            <li>
              <Link to="/study-sessions" className={`nav-link ${isActive('/study-sessions')}`}>
                Sessioni
              </Link>
            </li>
            <li>
              <Link to="/calendar" className={`nav-link ${isActive('/calendar')}`}>
                Calendario
              </Link>
            </li>
            <li>
              <Link to="/statistics" className={`nav-link ${isActive('/statistics')}`}>
                Statistiche
              </Link>
            </li>
            <li>
              <Link to="/pomodoro" className={`nav-link ${isActive('/pomodoro')}`}>
                Pomodoro
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;