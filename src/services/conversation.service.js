import IORedis from 'ioredis';
import config from '../config/index.js';
import { CONVERSATION } from '../config/constants.js';
import logger from '../utils/logger.js';

let redisClient;
try {
  redisClient = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
} catch (error) {
  logger.error({ err: error }, 'Redis connection error for conversation service');
}

const getKey = (userId) => `conv:${userId}`;

/**
 * Lấy lịch sử hội thoại
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getHistory = async (userId) => {
  if (!redisClient) return [];

  try {
    const data = await redisClient.get(getKey(userId));
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to get conversation history');
    return [];
  }
};

/**
 * Thêm lượt tương tác vào lịch sử
 * @param {string} userId
 * @param {string} userMessage
 * @param {string} botMessage
 */
export const addToHistory = async (userId, userMessage, botMessage) => {
  if (!redisClient) return;

  try {
    const history = await getHistory(userId);
    
    // Thêm lượt mới
    history.push(
      { role: 'user', content: userMessage },
      { role: 'model', content: botMessage }
    );

    // Giữ lại N lượt gần nhất (1 lượt = 2 tin)
    const maxItems = CONVERSATION.MAX_HISTORY_MESSAGES * 2;
    const trimmedHistory = history.length > maxItems 
      ? history.slice(history.length - maxItems) 
      : history;

    const key = getKey(userId);
    const multi = redisClient.multi();
    
    multi.set(key, JSON.stringify(trimmedHistory));
    multi.expire(key, CONVERSATION.HISTORY_TTL_SECONDS);
    
    await multi.exec();
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to save conversation history');
  }
};
