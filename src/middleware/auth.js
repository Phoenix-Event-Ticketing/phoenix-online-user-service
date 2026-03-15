import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Verify JWT from Authorization: Bearer <token> and attach decoded payload to req.user.
 * Responds 401 if missing or invalid.
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
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
