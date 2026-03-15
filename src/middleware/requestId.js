import { randomUUID } from 'crypto';

/**
 * Attach or propagate request_id for request correlation (logging format spec).
 * Uses X-Request-Id header if present, otherwise generates a new UUID.
 */
export default function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || `req-${randomUUID().slice(0, 8)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
}
