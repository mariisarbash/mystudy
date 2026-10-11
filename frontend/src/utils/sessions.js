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
