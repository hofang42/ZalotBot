import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { QUEUE } from '../config/constants.js';
import logger from '../utils/logger.js';
import { processMessageJob } from '../jobs/processMessage.job.js';

let connection;
try {
  connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
} catch (error) {
  logger.error({ err: error }, 'Redis connection error for queue');
}

export const messageQueue = connection 
  ? new Queue(QUEUE.NAME, { connection }) 
  : null;

/**
 * Thêm job vào queue
 * @param {Object} data Dữ liệu tin nhắn
 */
export const addMessageJob = async (data) => {
  // Vercel serverless functions freeze immediately after response.
  // We must process the job synchronously before returning 200 OK.
  if (process.env.VERCEL) {
    logger.info('Running in Vercel, processing job synchronously');
    return processMessageJob({ data });
  }

  if (!messageQueue) {
    logger.error('Queue is not initialized, cannot add job');
    // Nếu chạy không có Redis (như dev mode lười), xử lý đồng bộ luôn (fail-open strategy)
    return processMessageJob({ data });
  }

  // Idempotency: dùng jobId là message_id để BullMQ tự loại trùng lặp
  const jobId = data.message?.message_id || Date.now().toString();
  
  await messageQueue.add('process-message', data, {
    jobId,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Giữ lại 100 failed jobs để debug
  });
  
  logger.debug({ jobId }, 'Job enqueued');
};

let worker;

/**
 * Khởi động Worker (Không dùng cho Vercel serverless)
 */
export const startWorker = () => {
  if (!connection) {
    logger.warn('Cannot start worker without Redis connection');
    return;
  }

  // Serverless environments shouldn't run persistent workers
  if (config.env === 'production' && process.env.VERCEL) {
    logger.info('Running in Vercel, skipping persistent worker initialization');
    return;
  }

  worker = new Worker(QUEUE.NAME, processMessageJob, { connection });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
  });

  logger.info('Background worker started');
};

/**
 * Graceful shutdown worker
 */
export const stopWorker = async () => {
  if (worker) {
    logger.info('Closing background worker...');
    await worker.close();
  }
};
