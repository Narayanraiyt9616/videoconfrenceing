/**
 * Express error handling middleware
 */

export function errorHandler(err, req, res, next) {
  console.error('[Kalesh Server Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error in Kalesh Arena';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}
