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
import userRoutes from './routes/users.js';

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
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id || req.headers['x-request-id'],
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

export default app;
