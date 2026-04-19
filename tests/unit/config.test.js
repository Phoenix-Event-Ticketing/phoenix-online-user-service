import { describe, expect, it } from '@jest/globals';
import config, { parseServiceRegistry } from '../../src/config/index.js';

describe('config', () => {
  it('exports port', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });
  it('exports serviceName', () => {
    expect(config.serviceName).toBe('user-service');
  });
});

describe('parseServiceRegistry', () => {
  it('returns empty object for empty input', () => {
    expect(parseServiceRegistry(undefined)).toEqual({});
    expect(parseServiceRegistry('')).toEqual({});
    expect(parseServiceRegistry('   ')).toEqual({});
  });
  it('parses valid JSON map of service id to permission arrays', () => {
    const raw = JSON.stringify({
      'booking-service': ['BATCH_USER_LOOKUP', 'VIEW_USERS'],
      'event-service': ['CREATE_EVENT'],
    });
    expect(parseServiceRegistry(raw)).toEqual({
      'booking-service': ['BATCH_USER_LOOKUP', 'VIEW_USERS'],
      'event-service': ['CREATE_EVENT'],
    });
  });
  it('filters non-string entries in permission arrays', () => {
    const raw = JSON.stringify({ svc: ['A', 1, null, 'B'] });
    expect(parseServiceRegistry(raw)).toEqual({ svc: ['A', 'B'] });
  });
  it('returns empty object for invalid JSON', () => {
    expect(parseServiceRegistry('not json')).toEqual({});
  });
});
