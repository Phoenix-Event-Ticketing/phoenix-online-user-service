import { randomUUID } from 'crypto';

/**
 * Attach or propagate request_id and span_id for request correlation and tracing.
 * request_id: unique ID for this request in this service (from X-Request-Id or generated).
 * span_id: ID for this service's unit of work (for distributed tracing).
 */
export default function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || `req-${randomUUID().slice(0, 8)}`;
  req.traceId = req.headers['x-trace-id'] || req.headers.traceparent || req.id;
  req.spanId = req.headers['x-span-id'] || randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.id);
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}
