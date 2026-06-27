import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import { startWorker, stopWorker } from './services/queue.service.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.env} mode`);
  
  // Khởi động worker xử lý job nếu không phải serverless
  startWorker();
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  await stopWorker();
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
