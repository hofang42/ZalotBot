import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // SyntaxError from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ err }, 'Bad JSON format in request');
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON payload' });
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled Error');

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong processing your request'
  });
};
