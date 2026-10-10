const express = require('express');
const cors = require('cors');
require('dotenv').config();

const courseRoutes = require('./routes/courseRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const topicRoutes = require('./routes/topicRoutes');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

const app = express();

/**
 * CORS.
 *
 * In production the frontend and the API are served from the same origin, so
 * no cross-origin request should occur at all. CORS stays configurable for
 * local setups where the two run on different ports; set CORS_ORIGIN to lock
 * it down. It is no longer a blanket '*' with every method enabled.
 */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Bounded body size: the syllabus importer accepts pasted text, but not
// unbounded payloads.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

/**
 * Ensure a database connection before any data route.
 *
 * Locally server.js connects at startup, but a serverless handler has no
 * startup hook — it is invoked cold. connectDB() caches, so this is a no-op
 * once connected and costs nothing on warm requests.
 */
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/courses', courseRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/topics', topicRoutes);

app.use('/api', (req, res) =>
  res.status(404).json({ success: false, error: 'Endpoint non trovato' })
);

app.use(errorHandler);

module.exports = app;
