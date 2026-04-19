import { describe, expect, it, jest } from '@jest/globals';
import {
  authorizeAssignRole,
  authorizeBatch,
  authorizeGetProfile,
  authorizeUpdateProfile,
} from '../../src/middleware/authorize.js';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authorizeGetProfile', () => {
  it('allows user viewing own profile with VIEW_PROFILE', () => {
    const req = {
      params: { id: 'u1' },
      auth: { kind: 'user', userId: 'u1', permissions: ['VIEW_PROFILE'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeGetProfile(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  it('forbids user viewing other profile without VIEW_USERS', () => {
    const req = {
      params: { id: 'other' },
      auth: { kind: 'user', userId: 'u1', permissions: ['VIEW_PROFILE'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeGetProfile(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it('allows user with VIEW_USERS for any id', () => {
    const req = {
      params: { id: 'other' },
      auth: { kind: 'user', userId: 'u1', permissions: ['VIEW_USERS'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeGetProfile(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('allows service with VIEW_USERS in registry', () => {
    const req = {
      params: { id: 'u1' },
      auth: { kind: 'service', serviceId: 'booking-service', permissions: ['VIEW_USERS'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeGetProfile(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('forbids service without VIEW_USERS', () => {
    const req = {
      params: { id: 'u1' },
      auth: { kind: 'service', serviceId: 'x', permissions: ['BATCH_USER_LOOKUP'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeGetProfile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('authorizeUpdateProfile', () => {
  it('allows self with UPDATE_PROFILE', () => {
    const req = {
      params: { id: 'u1' },
      auth: { kind: 'user', userId: 'u1', permissions: ['UPDATE_PROFILE'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeUpdateProfile(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('forbids service token', () => {
    const req = {
      params: { id: 'u1' },
      auth: { kind: 'service', serviceId: 's', permissions: ['MANAGE_USERS'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeUpdateProfile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('authorizeAssignRole', () => {
  it('allows user with ASSIGN_ROLE', () => {
    const req = {
      auth: { kind: 'user', userId: 'admin', permissions: ['ASSIGN_ROLE'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeAssignRole(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('forbids service', () => {
    const req = {
      auth: { kind: 'service', serviceId: 's', permissions: ['ASSIGN_ROLE'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeAssignRole(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('authorizeBatch', () => {
  it('allows service with BATCH_USER_LOOKUP', () => {
    const req = {
      auth: { kind: 'service', serviceId: 'b', permissions: ['BATCH_USER_LOOKUP'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeBatch(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('forbids service without BATCH_USER_LOOKUP', () => {
    const req = {
      auth: { kind: 'service', serviceId: 'b', permissions: ['VIEW_USERS'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeBatch(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it('allows user with VIEW_USERS', () => {
    const req = {
      auth: { kind: 'user', userId: 'u1', permissions: ['VIEW_USERS'] },
    };
    const res = mockRes();
    const next = jest.fn();
    authorizeBatch(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
