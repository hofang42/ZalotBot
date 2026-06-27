import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Verify webhook request.
 * Zalo Bot Platform gửi mã xác thực qua header X-Bot-Api-Secret-Token
 */
export const verifyZaloSecret = (req, res, next) => {
  const secretToken = req.headers['x-bot-api-secret-token'];
  const configToken = config.zalo.webhookSecret;

  if (secretToken !== configToken) {
    logger.warn({ pathTokenLength: secretToken?.length, envTokenLength: configToken?.length }, 'Webhook request with invalid secret token in header');
    return res.status(403).json({ error: 'Unauthorized', message: 'Invalid Secret Token' });
  }

  next();
};
