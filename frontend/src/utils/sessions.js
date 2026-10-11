/**
 * `session.course` comes back in two different shapes.
 *
 * GET /api/study-sessions runs `.populate('course')`, so `course` is the whole
 * course document. POST /api/study-sessions returns the freshly saved record
 * *without* populating, so `course` is just the id string.
 *
 * The dashboard, the statistics page and the calendar all compared
 * `session.course === course._id` — object against string — which is never
 * true. The visible result was a dashboard that showed "Corso" instead of the
 * course name and 0 minuti / 0 sessioni for every course, a statistics page
 * whose "Distribuzione del tempo per corso" was always empty, and calendar
 * events that never picked up their course colour.
 *
 * These helpers accept either shape so callers stop caring which one they got.
 */

/** The course id of a session, whatever shape the API returned. */
export const courseIdOf = (session) => {
  const course = session?.course;
  if (!course) return null;
  return typeof course === 'object' ? course._id ?? null : course;
};

/** The full course for a session, resolved against a list of known courses. */
export const courseOf = (session, courses = []) => {
  const course = session?.course;
  if (course && typeof course === 'object' && course.name) return course;
  const id = courseIdOf(session);
  return courses.find((c) => c._id === id) || null;
};

/**
 * Recorded (past-dated) vs planned (future-dated) sessions.
 *
 * `StudySession` has no completion flag — unlike `Lesson` and `Topic`, which
 * both have `completed`. A session is just a course, a date, a duration and an
 * optional note, so the app cannot know whether a session actually happened.
 * What it does know is whether the session's date has passed.
 *
 * Summing every session into one "tempo studiato" total therefore counted
 * future plans as study already done: a 3-hour session booked for next week
 * inflated the total the moment it was saved. These helpers split the two so
 * the interface can label them separately ("tempo registrato" / "tempo
 * pianificato") without claiming that a past-dated session was completed.
 *
 * The date is the only signal available; adding a real completion state would
 * mean changing the schema and the API, which is out of scope here.
 */

/** True when the session's date and time have already passed. */
export const isRecorded = (session, now = Date.now()) => {
  const t = new Date(session?.date).getTime();
  // An unparseable date keeps its existing behaviour of counting towards the
  // totals rather than disappearing from both halves.
  return Number.isNaN(t) ? true : t <= now;
};

/** Split a list into { recorded, planned }; together they are the whole list. */
export const splitByTime = (sessions = [], now = Date.now()) => {
  const recorded = [];
  const planned = [];
  sessions.forEach((s) => (isRecorded(s, now) ? recorded : planned).push(s));
  return { recorded, planned };
};

/** Total minutes of a list of sessions. */
export const totalMinutes = (sessions = []) =>
  sessions.reduce((sum, s) => sum + (s?.duration || 0), 0);
