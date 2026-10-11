/**
 * Server entrypoint.
 *
 * The Express app itself lives in app.js with no listen() call, so the same app
 * can also be mounted by another host (a test harness, a serverless handler)
 * without starting a listener.
 *
 * listen() is called synchronously at module startup, deliberately, rather
 * than inside the connection promise. Correctness does not depend on
 * connecting first: app.js awaits connectDB() in middleware ahead of every
 * data route, and connectDB() caches, so the first request connects and later
 * ones reuse it.
 *
 * The eager call below is only a warm-up, so a local first request is not the
 * one paying for the connection. A failure is logged rather than fatal: the
 * server stays up and recovers once the database is reachable again, instead
 * of exiting and needing a manual restart.
 */
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

connectDB().catch((err) => {
  console.error('MongoDB non raggiungibile all’avvio:', err.message);
  console.error('Il server resta attivo; le richieste ritenteranno la connessione.');
});

app.listen(PORT, () => {
  console.log(`MyStudy API running on http://localhost:${PORT}`);
});
