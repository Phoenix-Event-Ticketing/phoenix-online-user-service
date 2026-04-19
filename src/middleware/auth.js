import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Build unified auth context from decoded JWT.
 * @param {import('jsonwebtoken').JwtPayload} decoded
 */
function buildAuth(decoded) {
  if (decoded.typ === 'service') {
    const serviceId = typeof decoded.sub === 'string' ? decoded.sub : '';
    const permissions = config.serviceRegistry[serviceId] ?? [];
    return {
      kind: 'service',
      serviceId,
      permissions,
    };
  }
  const permissions = Array.isArray(decoded.permissions)
    ? decoded.permissions.filter((p) => typeof p === 'string')
    : [];
  const userId = typeof decoded.sub === 'string' ? decoded.sub : '';
  return {
    kind: 'user',
    userId,
    email: decoded.email,
    role: decoded.role,
    permissions,
  };
}

/**
 * Verify JWT from Authorization: Bearer <token>.
 * Sets req.user (decoded payload) and req.auth (user vs service with resolved permissions).
 * Service tokens: typ=service, sub=service id; permissions from config.serviceRegistry.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }
  const trimmed = authHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }
  const token = trimmed.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      clockTolerance: 10,
    });
    req.user = decoded;
    req.auth = buildAuth(decoded);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
