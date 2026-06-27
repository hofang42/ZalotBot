import IORedis from 'ioredis';
import config from '../config/index.js';
import { RATE_LIMIT } from '../config/constants.js';
import logger from '../utils/logger.js';
import { sendTextMessage } from '../services/zalo.service.js';

let redisClient;
try {
  redisClient = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
} catch (error) {
  logger.error({ err: error }, 'Redis connection error for rate limiter');
}

const checkRateLimit = async (userId, limit, windowSeconds, prefix) => {
  if (!redisClient) return true;

  const key = `ratelimit:${prefix}:${userId}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  try {
    const multi = redisClient.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zcard(key);
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const count = results[1][1];

    if (count >= limit) {
      return false;
    }
    return true;
  } catch (error) {
    logger.error({ err: error, userId }, 'Rate limiter Redis error');
    return true;
  }
};

export const rateLimiter = async (req, res, next) => {
  const userId = req.body?.message?.chat?.id;
  if (!userId) return next();

  const isShortTermAllowed = await checkRateLimit(
    userId,
    RATE_LIMIT.SHORT_TERM.POINTS,
    RATE_LIMIT.SHORT_TERM.DURATION,
    'short'
  );

  if (!isShortTermAllowed) {
    logger.warn({ userId }, 'Short-term rate limit exceeded');
    res.status(200).json({ ok: true, description: 'ignored_rate_limit' });
    await sendTextMessage(userId, "Bạn đang nhắn hơi nhanh, vui lòng đợi một lát nhé ⏳").catch(() => {});
    return;
  }

  const isLongTermAllowed = await checkRateLimit(
    userId,
    RATE_LIMIT.LONG_TERM.POINTS,
    RATE_LIMIT.LONG_TERM.DURATION,
    'long'
  );

  if (!isLongTermAllowed) {
    logger.warn({ userId }, 'Long-term rate limit exceeded');
    res.status(200).json({ ok: true, description: 'ignored_rate_limit' });
    await sendTextMessage(userId, "Bạn đã vượt quá số tin nhắn trong giờ này, vui lòng quay lại sau nhé 🛑").catch(() => {});
    return;
  }

  next();
};
