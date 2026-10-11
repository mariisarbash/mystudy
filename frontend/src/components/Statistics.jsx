import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaRegClock, FaBookOpen } from 'react-icons/fa';
import './Statistics.css';
import { api } from '../services/api';
import { courseIdOf, splitByTime, totalMinutes } from '../utils/sessions';

function Statistics() {
  const [stats, setStats] = useState({
    recordedCount: 0,
    recordedMinutes: 0,
    plannedCount: 0,
    plannedMinutes: 0,
    courseStats: [],
    lastWeekSessions: { labels: [], data: [] },
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
        /*
          Recorded (past-dated) and planned (future-dated) sessions are kept
          apart from here on. A study session has no completion flag, so every
          number below that describes time spent is built from past-dated
          records only; future sessions are reported separately as plans.

          The time-range selector is retrospective, so it filters the recorded
          half only. Upcoming sessions are counted in full whatever range is
          selected — filtering next month's plan out of "ultima settimana"
          would quietly hide it.
        */
        const now = Date.now();
        const { recorded: allRecorded, planned } = splitByTime(sessions, now);
        const recorded = filterSessionsByTimeRange(allRecorded, timeRange);
        
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
            
            recorded.forEach(session => {
              // `session.course` is populated into an object by the API, so
              // indexing the map with it directly produced the key
              // "[object Object]" and never matched: "Distribuzione del tempo
              // per corso" was permanently empty.
              const id = courseIdOf(session);
              if (id && coursesMap[id]) {
                coursesMap[id].minutes += session.duration || 0;
                coursesMap[id].sessions += 1;
              }
            });
            
            const courseStatsArray = Object.values(coursesMap).filter(course => course.minutes > 0);
            courseStatsArray.sort((a, b) => b.minutes - a.minutes);
            
            setStats({
              recordedCount: recorded.length,
              recordedMinutes: totalMinutes(recorded),
              plannedCount: planned.length,
              plannedMinutes: totalMinutes(planned),
              courseStats: courseStatsArray,
              lastWeekSessions: getLast7DaysData(recorded),
              dailyAverage: calculateDailyAverage(recorded)
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
    
    return Math.round(totalMinutes(sessions) / daysDiff);
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
    return stats.recordedMinutes > 0 ? (courseMinutes / stats.recordedMinutes) * 100 : 0;
  };

  if (loading) {
    return <div className="loading-container">Caricamento statistiche...</div>;
  }

  // Render bar chart for last 7 days
  const renderWeeklyChart = () => {
    const maxValue = Math.max(...stats.lastWeekSessions.data) || 100;

    return (
      <figure className="weekly-chart">
        <figcaption>
          <h3>Minuti registrati negli ultimi 7 giorni</h3>
        </figcaption>
        <div className="chart-container">
          {stats.lastWeekSessions.data.map((value, index) => (
            <div className="chart-column" key={index}>
              {/*
                The bar's percentage height needs a parent with a definite
                height to resolve against. Previously it sat directly in an
                auto-height flex column, so every bar collapsed to its 4px
                minimum and the chart was a row of identical dashes whatever
                the values were.
              */}
              <div className="chart-bar-track">
                <div
                  className="chart-bar"
                  style={{
                    height: `${(value / maxValue) * 100}%`,
                    backgroundColor: value > 0 ? '#2a66b3' : '#dfe4ea',
                  }}
                >
                  <span className="chart-value">
                    {value}
                    <span className="visually-hidden"> minuti</span>
                  </span>
                </div>
              </div>
              <div className="chart-label">{stats.lastWeekSessions.labels[index]}</div>
            </div>
          ))}
        </div>
      </figure>
    );
  };

  const hasAnySession = stats.recordedCount > 0 || stats.plannedCount > 0;

  return (
    <div className="statistics-container">
      <div className="container">
        <div className="statistics-header">
          <h1 className="h2 mb-0">Statistiche di studio</h1>

          <div className="time-range-selector" role="group" aria-label="Periodo da analizzare">
            {[
              { key: 'week', label: 'Ultima settimana' },
              { key: 'month', label: 'Ultimo mese' },
              { key: 'all', label: 'Tutto il tempo' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`time-button ${timeRange === key ? 'active' : ''}`}
                aria-pressed={timeRange === key}
                onClick={() => setTimeRange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!hasAnySession ? (
          /*
            First-use state. It describes the three views this page builds
            once there is data; it deliberately shows no numbers, no sample
            chart and no placeholder bars, so nothing here can be mistaken
            for real statistics.
          */
          <div className="stats-empty">
            <span className="stats-empty__icon" aria-hidden="true">
              <FaChartBar size={26} />
            </span>
            <h2 className="stats-empty__title">
              {timeRange === 'all'
                ? 'Ancora nessuna statistica'
                : 'Nessuna sessione in questo periodo'}
            </h2>
            <p className="stats-empty__text">
              {timeRange === 'all'
                ? 'Le statistiche si costruiscono dalle sessioni di studio che registri. Appena ne aggiungi la prima, qui troverai:'
                : 'Non ci sono sessioni nel periodo selezionato. Prova ad ampliarlo, oppure aggiungi una sessione. Qui troverai:'}
            </p>

            <ul className="stats-empty__list">
              <li>
                <FaRegClock aria-hidden="true" />
                <span>Il tempo registrato e la media giornaliera</span>
              </li>
              <li>
                <FaChartBar aria-hidden="true" />
                <span>L’andamento dei minuti registrati negli ultimi 7 giorni</span>
              </li>
              <li>
                <FaBookOpen aria-hidden="true" />
                <span>La distribuzione del tempo fra i tuoi corsi</span>
              </li>
            </ul>

            <Link to="/study-sessions" className="btn btn-primary btn-lg">
              Aggiungi una sessione di studio
            </Link>
          </div>
        ) : (
          <>
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-value">{stats.recordedCount}</div>
                <div className="stat-label">Sessioni registrate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.recordedMinutes)}</div>
                <div className="stat-label">Tempo registrato</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.dailyAverage)}</div>
                <div className="stat-label">Media giornaliera del tempo registrato</div>
              </div>

              {/* Shown only when there is something planned, so the page never
                  displays an invented "0" alongside the real numbers. */}
              {stats.plannedCount > 0 && (
                <div className="stat-card stat-card--planned">
                  <div className="stat-value">{formatTime(stats.plannedMinutes)}</div>
                  <div className="stat-label">Tempo pianificato</div>
                  <p className="stat-note">
                    {stats.plannedCount === 1
                      ? '1 sessione futura in calendario'
                      : `${stats.plannedCount} sessioni future in calendario`}
                  </p>
                </div>
              )}
            </div>

            {/*
              The honest caveat. These totals are built from the session date,
              which is the only signal the data model has: there is no field
              recording whether a session was actually carried out.
            */}
            <p className="stats-caption">
              Il <strong>tempo registrato</strong> somma le sessioni con una data già
              passata, il <strong>tempo pianificato</strong> quelle con una data futura.
              MyStudy non tiene traccia di quali sessioni siano state davvero svolte, per
              cui una sessione passata resta un’annotazione, non una conferma.
            </p>

            {stats.recordedCount > 0 && renderWeeklyChart()}

            <div className="course-stats">
              <h2 className="h5">Distribuzione del tempo registrato per corso</h2>

              {stats.recordedCount === 0 ? (
                <p className="text-body-secondary mb-0">
                  Non hai ancora sessioni con una data passata: per ora c’è solo tempo
                  pianificato.
                </p>
              ) : stats.courseStats.length === 0 ? (
                <p className="text-body-secondary mb-0">
                  Le sessioni registrate non sono collegate a nessun corso esistente.
                </p>
              ) : (
                stats.courseStats.map((course) => {
                  const percent = calculatePercentage(course.minutes);
                  return (
                    <div className="course-stat-item" key={course.id}>
                      <div className="course-info">
                        <h3 className="h6 mb-1">{course.name}</h3>
                        <div className="course-details">
                          <span>{formatTime(course.minutes)}</span>
                          <span aria-hidden="true">•</span>
                          <span>
                            {course.sessions} {course.sessions === 1 ? 'sessione' : 'sessioni'}
                          </span>
                        </div>
                      </div>
                      <div
                        className="progress-bar-container"
                        role="progressbar"
                        aria-label={`Quota di tempo registrato per ${course.name}`}
                        aria-valuenow={Number(percent.toFixed(1))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="progress-bar"
                          style={{ width: `${percent}%`, backgroundColor: course.color }}
                        />
                      </div>
                      <div className="percentage">{percent.toFixed(1)}%</div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Statistics;
