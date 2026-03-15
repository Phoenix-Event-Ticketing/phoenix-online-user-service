import prisma from './db/client.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import app from './app.js';

const baseMeta = {
  service: config.serviceName,
  environment: config.nodeEnv,
  ...(config.hostname && { hostname: config.hostname }),
};

async function start() {
  try {
    await prisma.$connect();
    logger.info({ ...baseMeta, event: 'database_connected', message: 'Database connection established' });
  } catch (err) {
    logger.fatal({
      ...baseMeta,
      event: 'database_connection_failed',
      message: 'Database connection failed',
      metadata: { error: err.message },
    });
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    const metadata = { port: config.port };
    if (config.version) metadata.version = config.version;
    if (config.commitSha) metadata.commit_sha = config.commitSha;
    if (config.buildId) metadata.build_id = config.buildId;
    logger.info({
      ...baseMeta,
      event: 'server_started',
      message: 'HTTP server started',
      metadata,
    });
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      logger.info({ ...baseMeta, event: 'server_stopped', message: 'Server shut down' });
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.fatal({
    ...baseMeta,
    event: 'server_start_failed',
    message: 'Failed to start server',
    metadata: { error: err.message },
  });
  process.exit(1);
});
