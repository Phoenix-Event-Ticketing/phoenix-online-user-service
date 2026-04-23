import 'dotenv/config';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { hostname } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
let packageVersion = process.env.VERSION;
if (!packageVersion) {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));
    packageVersion = pkg.version || undefined;
  } catch {
    packageVersion = undefined;
  }
}

const defaultLogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * JSON map: service id (JWT sub when typ=service) -> allowed permission names.
 * @param {string | undefined} raw
 * @returns {Record<string, string[]>}
 */
export function parseServiceRegistry(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      /** @type {Record<string, string[]>} */
      const out = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (Array.isArray(v)) {
          out[k] = v.filter((x) => typeof x === 'string');
        } else {
          out[k] = [];
        }
      }
      return out;
    }
  } catch {
    // invalid JSON — treat as empty
  }
  return {};
}

const serviceRegistry = parseServiceRegistry(process.env.SERVICE_REGISTRY);

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || defaultLogLevel,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: (process.env.JWT_SECRET || 'change-me-in-production').trim(),
    expiresIn: process.env.JWT_EXPIRES_IN || '3600',
    issuer: process.env.JWT_ISSUER || 'phoenix-online-auth',
  },
  /** Map of service id -> permission names (from SERVICE_REGISTRY env). */
  serviceRegistry,
  serviceName: 'user-service',
  metricsEnabled:
    String(process.env.METRICS_ENABLED || 'true').toLowerCase() === 'true',
  // Prefer OTLP endpoint; keep JAEGER_ENDPOINT fallback for phased env compatibility.
  otelTracesEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || process.env.JAEGER_ENDPOINT || '',
  otelServiceName: process.env.OTEL_SERVICE_NAME || 'user-service',
  otelTracesSampler: process.env.OTEL_TRACES_SAMPLER || '1.0',
  version: packageVersion,
  commitSha: process.env.COMMIT_SHA,
  buildId: process.env.BUILD_ID,
  hostname: hostname(),
};
