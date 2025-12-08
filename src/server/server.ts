import app from './app';
import config from '../config/config';
import logger from '../config/logger';
// import { prisma } from '../config/database';
import prisma from '../prismaClient';

const PORT = config.PORT;

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, gracefully closing...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.NODE_ENV}`);
  logger.info(`🔗 API Version: ${config.API_VERSION}`);
  logger.info(`🌐 CORS Origin: ${config.CORS_ORIGIN}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

export default server;