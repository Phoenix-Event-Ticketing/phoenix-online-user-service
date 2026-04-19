import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import requestId from './middleware/requestId.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import config from './config/index.js';
import userRoutes from './routes/users.js';
import prisma from './db/client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openApiPath = join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiSpec = YAML.load(readFileSync(openApiPath, 'utf8'));

const app = express();

// Swagger UI before Helmet so CSP does not block the docs page
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestId);

/** Derive a semantic operation name (action) from method + path for logging. */
function deriveOperation(req) {
  const path = (req.url || req.originalUrl || '').split('?')[0];
  const method = (req.method || '').toUpperCase();

  if (path === '/health') return 'health';
  if (path === '/health/ready') return 'health_ready';

  const afterMount = path.replace(/^\/api\/v1\/users\/?/, '') || '';
  const segments = afterMount.split('/').filter(Boolean);

  if (method === 'POST' && segments[0] === 'login') return 'login';
  if (method === 'POST' && segments[0] === 'register') return 'register';
  if (method === 'POST' && segments[0] === 'batch') return 'batch_lookup';
  if (method === 'GET' && segments.length === 1) return 'get_profile';
  if (method === 'PUT' && segments.length === 1) return 'update_profile';
  if (method === 'PUT' && segments.length === 2 && segments[1] === 'role') return 'assign_role';

  return 'unknown';
}

/** Normalized route pattern (e.g. /api/v1/users/:id); path is the actual requested path. */
function getRouteAndPath(req) {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  const base = req.baseUrl || '';
  const routePath = req.route?.path ?? '';
  const route = routePath ? `${base}${routePath}` : path;
  return { route, path };
}

/** Human-friendly success message per operation. */
function getSuccessMessage(req) {
  const op = deriveOperation(req);
  const messages = {
    health: 'Health check succeeded',
    health_ready: 'Readiness check succeeded',
    login: 'User login succeeded',
    register: 'User registered',
    batch_lookup: 'Batch lookup completed',
    get_profile: 'User profile retrieved',
    update_profile: 'User profile updated',
    assign_role: 'Role assigned',
    unknown: 'Request completed',
  };
  return messages[op] ?? 'Request completed';
}

/** Human-friendly failure message. */
function getErrorMessage(req, res, err) {
  const op = deriveOperation(req);
  const status = res?.statusCode;
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  if (status === 404) return op === 'get_profile' ? 'User profile not found' : 'Not found';
  if (status >= 500) return 'Request failed';
  return err?.message ? err.message : 'Request failed';
}

function getErrorCode(status) {
  if (!status) return 'UNKNOWN';
  if (status === 401) return 'AUTH_REQUIRED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'CLIENT_ERROR';
}

/** Build flat log object. Omit request_id so only pino-http binding provides it (no duplicate). */
function requestLogObject(req, res, durationMs, event, err = null) {
  const requestId = req.id || req.headers['x-request-id'];
  const { route, path } = getRouteAndPath(req);
  const http = {
    method: req.method,
    route,
    path,
    status_code: res && res.statusCode,
    duration_ms: durationMs,
  };
  const obj = {
    service: config.serviceName,
    environment: config.nodeEnv,
    event,
    trace_id: req.headers['x-trace-id'] || requestId,
    span_id: req.spanId,
    operation: deriveOperation(req),
    http,
  };
  if (config.hostname) obj.hostname = config.hostname;
  if (req.auth?.kind === 'user' && req.auth.userId) obj.user_id = req.auth.userId;
  else if (req.auth?.kind === 'service' && req.auth.serviceId) obj.service_id = req.auth.serviceId;
  if (err && res) {
    obj.error_code = getErrorCode(res.statusCode);
    obj.error_message = err.message;
  }
  return obj;
}

const httpLogger = logger.child({});

app.use(
  pinoHttp({
    logger: httpLogger,
    quietReqLogger: true,
    quietResLogger: true,
    customAttributeKeys: { reqId: 'request_id' },
    genReqId: (req) => req.id || req.headers['x-request-id'],
    customLogLevel: (req, res, err) => {
      if (req.url === '/health' || req.url === '/health/ready') return 'debug';
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessObject: (req, res, defaultObj) =>
      requestLogObject(req, res, defaultObj.responseTime, 'request_completed'),
    customSuccessMessage: (req) => getSuccessMessage(req),
    customErrorObject: (req, res, err, defaultObj) => {
      const event = res.statusCode >= 500 ? 'request_failed' : 'request_rejected';
      return requestLogObject(req, res, defaultObj.responseTime, event, err);
    },
    customErrorMessage: (req, res, err) => getErrorMessage(req, res, err),
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', ready: true, service: 'user-service' });
  } catch (err) {
    logger.warn({
      event: 'readiness_check_failed',
      message: 'Readiness check failed',
      metadata: { error: err.message },
    });
    res.status(503).json({ status: 'unavailable', ready: false, service: 'user-service' });
  }
});

app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

export default app;
