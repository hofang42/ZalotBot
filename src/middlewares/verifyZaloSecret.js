import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Verify webhook request.
 * Trong Zalo Bot Platform (giống Telegram), bảo mật Webhook thường được thực hiện 
 * bằng cách để URL chứa secret token. Ví dụ: /webhook/<BOT_TOKEN>
 */
export const verifyZaloSecret = (req, res, next) => {
  const botToken = req.params.botToken?.trim();
  const configToken = config.zalo.botToken?.trim();

  if (botToken !== configToken) {
    logger.warn({ pathToken: botToken, envTokenLength: configToken?.length }, 'Webhook request with invalid bot token in path');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
