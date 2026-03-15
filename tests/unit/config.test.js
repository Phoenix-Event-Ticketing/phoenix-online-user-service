import config from '../../src/config/index.js';

describe('config', () => {
  it('exports port', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });
  it('exports serviceName', () => {
    expect(config.serviceName).toBe('user-service');
  });
});
