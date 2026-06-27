import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { truncate } from '../utils/sanitize.js';

/**
 * Gửi tin nhắn văn bản qua Zalo Bot Platform API
 * @param {string} userId ID người nhận (chat_id)
 * @param {string} text Nội dung tin nhắn
 * @param {number} retryCount Số lần thử lại
 */
export const sendTextMessage = async (userId, text, retryCount = 1) => {
  if (!text) return;

  const safeText = truncate(text, 2000);
  const botToken = config.zalo.botToken;

  if (!botToken) {
    logger.error('ZALO_BOT_TOKEN is not configured');
    throw new Error('Missing ZALO_BOT_TOKEN');
  }

  const ZALO_API_URL = `https://bot-api.zaloplatforms.com/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: userId,
    text: safeText
  };

  try {
    const response = await axios.post(ZALO_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = response.data;
    if (!data.ok) {
      throw new Error(`Zalo API error: ${data.description || 'Unknown error'}`);
    }

    logger.debug({ userId }, 'Sent message successfully');
    return data;
  } catch (error) {
    if (retryCount > 0) {
      logger.warn({ err: error.response?.data || error, userId, retryCount }, 'Failed to send message, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendTextMessage(userId, text, retryCount - 1);
    }
    
    logger.error({ err: error.response?.data || error, userId }, 'Failed to send message after retries');
    throw error;
  }
};
