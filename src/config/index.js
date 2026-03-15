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
  },
  serviceName: 'user-service',
  version: packageVersion,
  commitSha: process.env.COMMIT_SHA,
  buildId: process.env.BUILD_ID,
  hostname: hostname(),
};
