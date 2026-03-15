import prisma from './db/client.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import app from './app.js';

async function start() {
  try {
    await prisma.$connect();
    logger.info({ message: 'Database connected' });
  } catch (err) {
    logger.fatal({ message: 'Database connection failed', metadata: { error: err.message } });
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info({ message: `Server listening on port ${config.port}`, metadata: { port: config.port } });
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      logger.info({ message: 'Server shut down' });
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.fatal({ message: 'Failed to start server', metadata: { error: err.message } });
  process.exit(1);
});
