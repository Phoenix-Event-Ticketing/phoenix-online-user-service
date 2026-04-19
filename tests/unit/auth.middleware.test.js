import { describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

describe('authenticate middleware', () => {
  const secret = 'test-jwt-secret-auth-mw';

  it('attaches user auth from JWT', async () => {
    jest.resetModules();
    process.env.JWT_SECRET = secret;
    process.env.SERVICE_REGISTRY = '';
    const { authenticate } = await import('../../src/middleware/auth.js');
    const token = jwt.sign(
      { sub: 'user-uuid-1', permissions: ['VIEW_PROFILE', 'UPDATE_PROFILE'] },
      secret,
      { algorithm: 'HS256' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.auth.kind).toBe('user');
    expect(req.auth.userId).toBe('user-uuid-1');
    expect(req.auth.permissions).toEqual(['VIEW_PROFILE', 'UPDATE_PROFILE']);
  });

  it('attaches service auth permissions from SERVICE_REGISTRY', async () => {
    jest.resetModules();
    process.env.JWT_SECRET = secret;
    process.env.SERVICE_REGISTRY = JSON.stringify({
      'booking-service': ['VIEW_USERS', 'BATCH_USER_LOOKUP'],
    });
    const { authenticate } = await import('../../src/middleware/auth.js');
    const token = jwt.sign({ typ: 'service', sub: 'booking-service' }, secret, { algorithm: 'HS256' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.auth.kind).toBe('service');
    expect(req.auth.serviceId).toBe('booking-service');
    expect(req.auth.permissions).toEqual(['VIEW_USERS', 'BATCH_USER_LOOKUP']);
  });

  it('returns 401 for invalid token', async () => {
    jest.resetModules();
    process.env.JWT_SECRET = secret;
    process.env.SERVICE_REGISTRY = '';
    const { authenticate } = await import('../../src/middleware/auth.js');
    const req = { headers: { authorization: 'Bearer not-a-valid-jwt' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
