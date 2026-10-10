/**
 * Central error handler.
 *
 * Previously every failure became a 500 — including a malformed id, which is a
 * client error. Mongoose's typed errors are mapped to the right status so the
 * API tells callers whether they sent something wrong or the server broke.
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Malformed ObjectId, e.g. GET /api/courses/not-a-real-id
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Identificativo non valido per il campo "${err.path}"`,
    });
  }

  // Schema validation, e.g. creating a course without a name
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dati non validi',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'JSON non valido' });
  }

  // Body larger than the configured limit
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Richiesta troppo grande' });
  }

  console.error(err.stack);
  return res.status(500).json({
    success: false,
    error: err.message || 'Errore del server',
  });
};

module.exports = errorHandler;
