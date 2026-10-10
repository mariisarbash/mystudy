import React, { useState, useEffect, useCallback } from 'react';
import './Statistics.css';
import { api } from '../services/api';

function Statistics() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    courseStats: [],
    lastWeekSessions: [],
    dailyAverage: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week'

  // Utilizzo di useCallback per memorizzare la funzione fetchStatistics
  const fetchStatistics = useCallback(() => {
    setLoading(true);
    
    // Fetch all sessions
    api.get('/api/study-sessions')
      .then(response => response.json())
      .then(sessions => {
        // Filter sessions by time range if needed
        const filteredSessions = filterSessionsByTimeRange(sessions, timeRange);
        
        // Fetch all courses
        api.get('/api/courses')
          .then(response => response.json())
          .then(courses => {
            const coursesMap = {};
            courses.forEach(course => {
              coursesMap[course._id] = {
                id: course._id,
                name: course.name,
                color: course.color,
                credits: course.credits,
                minutes: 0,
                sessions: 0
              };
            });
            
            // Calculate statistics
            let totalMinutes = 0;
            
            filteredSessions.forEach(session => {
              const duration = session.duration || 0;
              totalMinutes += duration;
              
              if (session.course && coursesMap[session.course]) {
                coursesMap[session.course].minutes += duration;
                coursesMap[session.course].sessions += 1;
              }
            });
            
            const courseStatsArray = Object.values(coursesMap).filter(course => course.minutes > 0);
            courseStatsArray.sort((a, b) => b.minutes - a.minutes);
            
            // Calculate last 7 days data
            const last7Days = getLast7DaysData(filteredSessions);
            
            // Calculate daily average
            const dailyAverage = calculateDailyAverage(filteredSessions);
            
            setStats({
              totalSessions: filteredSessions.length,
              totalMinutes: totalMinutes,
              courseStats: courseStatsArray,
              lastWeekSessions: last7Days,
              dailyAverage: dailyAverage
            });
            
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching courses:', error);
            setLoading(false);
          });
      })
      .catch(error => {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      });
  }, [timeRange]); // Dichiariamo timeRange come dipendenza

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]); // Ora includiamo fetchStatistics come dipendenza

  const filterSessionsByTimeRange = (sessions, range) => {
    const now = new Date();
    let cutoffDate;
    
    switch(range) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        return sessions; // All time
    }
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= cutoffDate;
    });
  };

  const getLast7DaysData = (sessions) => {
    const days = [];
    const dayLabels = [];
    const dayData = [0, 0, 0, 0, 0, 0, 0]; // Minutes for last 7 days
    
    // Generate the last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      days.push(date);
      
      // Format the day name (e.g., "Lun", "Mar")
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
      dayLabels.push(dayName);
    }
    
    // Map sessions to the correct day
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      
      for (let i = 0; i < 7; i++) {
        const day = days[i];
        
        if (sessionDate.getDate() === day.getDate() && 
            sessionDate.getMonth() === day.getMonth() && 
            sessionDate.getFullYear() === day.getFullYear()) {
          dayData[i] += session.duration || 0;
          break;
        }
      }
    });
    
    return { labels: dayLabels, data: dayData };
  };
  
  const calculateDailyAverage = (sessions) => {
    if (sessions.length === 0) return 0;
    
    // Get the earliest and latest session dates
    let earliestDate = new Date();
    let latestDate = new Date(0); // January 1, 1970
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate < earliestDate) {
        earliestDate = sessionDate;
      }
      if (sessionDate > latestDate) {
        latestDate = sessionDate;
      }
    });
    
    // Calculate the number of days
    const daysDiff = Math.max(1, Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1);
    
    // Calculate total minutes
    const totalMinutes = sessions.reduce((total, session) => total + (session.duration || 0), 0);
    
    return Math.round(totalMinutes / daysDiff);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minuti`;
    } else if (mins === 0) {
      return `${hours} ore`;
    } else {
      return `${hours} ore e ${mins} minuti`;
    }
  };
  
  const calculatePercentage = (courseMinutes) => {
    return stats.totalMinutes > 0 ? (courseMinutes / stats.totalMinutes) * 100 : 0;
  };

  if (loading) {
    return <div className="loading-container">Caricamento statistiche...</div>;
  }

  // Render bar chart for last 7 days
  const renderWeeklyChart = () => {
    const maxValue = Math.max(...stats.lastWeekSessions.data) || 100;
    
    return (
      <div className="weekly-chart">
        <h3>Minuti di studio negli ultimi 7 giorni</h3>
        <div className="chart-container">
          {stats.lastWeekSessions.data.map((value, index) => (
            <div className="chart-column" key={index}>
              <div 
                className="chart-bar" 
                style={{ 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: value > 0 ? '#3a7bd5' : '#e0e0e0'
                }}
              >
                <span className="chart-value">{value}</span>
              </div>
              <div className="chart-label">{stats.lastWeekSessions.labels[index]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="statistics-container">
      <div className="container">
        <div className="statistics-header">
          <h2>Statistiche di studio</h2>
          
          <div className="time-range-selector">
            <button 
              className={`time-button ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Ultima settimana
            </button>
            <button 
              className={`time-button ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Ultimo mese
            </button>
            <button 
              className={`time-button ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              Tutto il tempo
            </button>
          </div>
        </div>

        {stats.totalSessions === 0 ? (
          <div className="empty-state">
            <p>Non ci sono dati sufficienti per mostrare le statistiche.</p>
            <p>Inizia a registrare le tue sessioni di studio!</p>
          </div>
        ) : (
          <>
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-value">{stats.totalSessions}</div>
                <div className="stat-label">Sessioni totali</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.totalMinutes)}</div>
                <div className="stat-label">Tempo totale studiato</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.dailyAverage)}</div>
                <div className="stat-label">Media giornaliera</div>
              </div>
            </div>

            {renderWeeklyChart()}

            <div className="course-stats">
              <h3>Distribuzione del tempo per corso</h3>
              
              {stats.courseStats.map(course => (
                <div className="course-stat-item" key={course.id}>
                  <div className="course-info">
                    <h4>{course.name}</h4>
                    <div className="course-details">
                      <span>{formatTime(course.minutes)}</span>
                      <span>•</span>
                      <span>{course.sessions} sessioni</span>
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${calculatePercentage(course.minutes)}%`,
                        backgroundColor: course.color
                      }}
                    ></div>
                  </div>
                  <div className="percentage">
                    {calculatePercentage(course.minutes).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Statistics;