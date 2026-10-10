import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { api } from '../services/api';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch study sessions
    api.get('/api/study-sessions')
      .then(response => response.json())
      .then(data => {
        // Fetch courses to get colors
        api.get('/api/courses')
          .then(response => response.json())
          .then(coursesData => {
            // Create a lookup object for course colors
            const coursesLookup = {};
            coursesData.forEach(course => {
              coursesLookup[course._id] = {
                name: course.name,
                color: course.color
              };
            });
            setCourses(coursesLookup);
            
            // Format the events for the calendar
            const formattedEvents = data.map(session => {
              const courseInfo = session.course && coursesLookup[session.course] 
                ? coursesLookup[session.course] 
                : { name: 'Corso non specificato', color: '#3788d8' };
              
              const startDate = new Date(session.date);
              const endDate = new Date(new Date(session.date).getTime() + session.duration * 60000);
              
              return {
                id: session._id,
                title: session.topic || courseInfo.name,
                start: startDate,
                end: endDate,
                backgroundColor: courseInfo.color,
                borderColor: courseInfo.color,
                extendedProps: {
                  courseId: session.course,
                  courseName: courseInfo.name,
                  notes: session.notes,
                  duration: session.duration
                }
              };
            });
            
            setEvents(formattedEvents);
            setLoading(false);
          })
          .catch(error => {
            console.error('Errore nel caricamento dei corsi:', error);
            setLoading(false);
          });
      })
      .catch(error => {
        console.error('Errore nel caricamento delle sessioni:', error);
        setLoading(false);
      });
  }, []);

  const handleEventClick = (info) => {
    // Navigate to study sessions page
    navigate('/study-sessions', { state: { selectedSessionId: info.event.id } });
  };

  if (loading) {
    return <div className="loading-container">Caricamento calendario...</div>;
  }

  return (
    <div className="calendar-container">
      <div className="container">
        <h2 className="calendar-title">Calendario delle sessioni di studio</h2>
        
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            locale="it"
            buttonText={{
              today: 'Oggi',
              month: 'Mese',
              week: 'Settimana',
              day: 'Giorno'
            }}
            height="auto"
          />
        </div>

        <div className="calendar-legend">
          <h4>Legenda Corsi</h4>
          <div className="legend-items">
            {Object.keys(courses).map(courseId => (
              <div key={courseId} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: courses[courseId].color }}
                ></span>
                <span className="legend-name">{courses[courseId].name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;