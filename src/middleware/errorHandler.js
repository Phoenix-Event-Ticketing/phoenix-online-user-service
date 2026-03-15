import logger from '../utils/logger.js';

/**
 * Central error handler. Logs error and returns JSON response.
 * Does not expose stack or internal details in production.
 */
export default function errorHandler(err, req, res, next) {
  const requestId = req.id || req.headers['x-request-id'];
  logger.error(
    {
      request_id: requestId,
      message: err.message,
      metadata: { stack: err.stack },
    },
    'Request error'
  );

  const status = err.statusCode || err.status || 500;
  const body = {
    message: err.message || 'Internal server error',
    ...(req.id && { requestId: req.id }),
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
}
