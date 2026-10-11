import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { api } from '../services/api';
import { courseIdOf } from '../utils/sessions';
import { surfaceFor } from '../utils/color';

/** True while the viewport is narrower than `query`. */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

function Calendar() {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isNarrow = useMediaQuery('(max-width: 767.98px)');

  useEffect(() => {
    Promise.all([
      api.get('/api/study-sessions').then((r) => r.json()),
      api.get('/api/courses').then((r) => r.json()),
    ])
      .then(([sessions, coursesData]) => {
        const coursesLookup = {};
        coursesData.forEach((course) => {
          coursesLookup[course._id] = { name: course.name, color: course.color };
        });
        setCourses(coursesLookup);

        const formattedEvents = sessions.map((session) => {
          // `session.course` arrives populated (an object), so looking it up
          // by the raw value always missed and every event fell back to the
          // default blue with "Corso non specificato".
          const courseInfo = coursesLookup[courseIdOf(session)] || {
            name: 'Corso non specificato',
            color: '#3788d8',
          };

          return {
            id: session._id,
            title: session.topic || courseInfo.name,
            start: new Date(session.date),
            end: new Date(new Date(session.date).getTime() + session.duration * 60000),
            // In the week and day views FullCalendar writes white text on
            // this background, so use the contrast-corrected surface rather
            // than the raw course colour. Event text colour is left to
            // FullCalendar: month-view events render as a dot plus dark text
            // on the white cell, where forcing white would be invisible.
            // The legend swatches keep the raw colour.
            backgroundColor: surfaceFor(courseInfo.color || '#3a7bd5'),
            borderColor: surfaceFor(courseInfo.color || '#3a7bd5'),
            extendedProps: {
              courseName: courseInfo.name,
              notes: session.notes,
              duration: session.duration,
            },
          };
        });

        setEvents(formattedEvents);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Errore nel caricamento del calendario:', error);
        setLoading(false);
      });
  }, []);

  const handleEventClick = (info) => {
    navigate('/study-sessions', { state: { selectedSessionId: info.event.id } });
  };

  if (loading) {
    return <div className="loading-container">Caricamento calendario…</div>;
  }

  return (
    <div className="calendar-container">
      <div className="container">
        <h1 className="calendar-title h2">Calendario delle sessioni di studio</h1>

        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            /*
             * On a phone all five controls plus the month title ran to ~430px
             * and pushed the page sideways. Below 768px the view switcher
             * moves to its own row under the grid.
             */
            headerToolbar={
              isNarrow
                ? { left: 'prev,next', center: 'title', right: 'today' }
                : {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }
            }
            footerToolbar={
              isNarrow ? { center: 'dayGridMonth,timeGridWeek,timeGridDay' } : undefined
            }
            events={events}
            eventClick={handleEventClick}
            /* A month cell is too narrow for most titles, so they are
               truncated with an ellipsis in CSS. This puts the full text in a
               native tooltip so it stays reachable. */
            eventDidMount={({ el, event }) => {
              const course = event.extendedProps.courseName;
              el.setAttribute('title', course ? `${event.title} — ${course}` : event.title);
            }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            locale="it"
            buttonText={{ today: 'Oggi', month: 'Mese', week: 'Settimana', day: 'Giorno' }}
            buttonHints={{
              prev: 'Periodo precedente',
              next: 'Periodo successivo',
              today: 'Vai a oggi',
            }}
            height="auto"
            dayMaxEventRows={isNarrow ? 2 : false}
          />
        </div>

        {Object.keys(courses).length > 0 && (
          <div className="calendar-legend">
            <h2 className="h6">Legenda corsi</h2>
            <ul className="legend-items">
              {Object.keys(courses).map((courseId) => (
                <li key={courseId} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: courses[courseId].color }}
                    aria-hidden="true"
                  />
                  <span className="legend-name">{courses[courseId].name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
