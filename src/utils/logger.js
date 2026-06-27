import pino from 'pino';
import config from '../config/index.js';

const isDev = config.env !== 'production';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-bot-api-secret-token"]',
      'body.sender.id', // Depending on privacy requirements, might want to redact Zalo user IDs
      '*.token',
      '*.apiKey',
      '*.phone'
    ],
    censor: '[REDACTED]'
  },
  // Vercel / AWS Lambda does not support pino-pretty well due to worker threads and bundling issues
  ...(isDev && !process.env.VERCEL && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      }
    }
  })
});

export default logger;
