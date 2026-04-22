import logger from '../utils/logger.js';

/**
 * Central error handler. Logs error and returns JSON response.
 * Does not expose stack or internal details in production.
 */
export default function errorHandler(err, req, res, next) {
  const requestId = req.id || req.headers['x-request-id'];
  const traceId = req.traceId || req.headers['x-trace-id'] || req.headers.traceparent;
  logger.error(
    {
      request_id: requestId,
      trace_id: traceId,
      message: err.message,
      metadata: { stack: err.stack },
    },
    'Request error'
  );

  const status = err.statusCode || err.status || 500;
  const body = {
    timestamp: new Date().toISOString(),
    status,
    error: status >= 500 ? 'Internal Server Error' : status === 404 ? 'Not Found' : 'Error',
    errorCode: err.code || (status === 404 ? 'NOT_FOUND' : status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR'),
    message: err.message || 'Internal server error',
    ...(req.id && { requestId: req.id }),
    ...(traceId && { traceId }),
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
}
