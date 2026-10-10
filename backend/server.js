/**
 * Local development entry point.
 *
 * The Express app itself lives in app.js with no listen() call, so the same
 * app can be mounted by a serverless handler without starting a server.
 */
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MyStudy API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Impossibile connettersi a MongoDB:', err.message);
    process.exit(1);
  });
