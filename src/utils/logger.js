import pino from 'pino';
import config from '../config/index.js';

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: () => ({}),
  },
  base: {
    service: config.serviceName,
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  messageKey: 'message',
}).child({});

function serializeLog(obj) {
  const { request_id, trace_id, user_id, operation, metadata, ...rest } = obj;
  const out = {
    ...rest,
    timestamp: new Date().toISOString(),
  };
  if (request_id !== undefined) out.request_id = request_id;
  if (trace_id !== undefined) out.trace_id = trace_id;
  if (user_id !== undefined) out.user_id = user_id;
  if (operation !== undefined) out.operation = operation;
  if (metadata !== undefined) out.metadata = metadata;
  return out;
}

export function createRequestLogger(req) {
  const child = logger.child({
    request_id: req.id || req.headers['x-request-id'],
    trace_id: req.headers['x-trace-id'],
  });
  return {
    debug: (msg, meta) => child.debug(serializeLog({ ...meta, message: msg })),
    info: (msg, meta) => child.info(serializeLog({ ...meta, message: msg })),
    warn: (msg, meta) => child.warn(serializeLog({ ...meta, message: msg })),
    error: (msg, meta) => child.error(serializeLog({ ...meta, message: msg })),
    fatal: (msg, meta) => child.fatal(serializeLog({ ...meta, message: msg })),
  };
}

export default logger;
