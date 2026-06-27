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

/**
 * Gửi Sticker đến người dùng
 * @param {string} userId ID người nhận
 * @param {string} stickerUrl Đường dẫn sticker
 */
export const sendSticker = async (userId, stickerUrl) => {
  const botToken = config.zalo.botToken;
  if (!botToken) throw new Error('Missing ZALO_BOT_TOKEN');

  const ZALO_API_URL = `https://bot-api.zaloplatforms.com/bot${botToken}/sendSticker`;
  const payload = {
    chat_id: userId,
    sticker: stickerUrl
  };

  try {
    const response = await axios.post(ZALO_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    logger.error({ err: error.response?.data || error, userId }, 'Failed to send sticker');
    throw error;
  }
};

/**
 * Gửi trạng thái Chat Action (đang gõ, đang gửi ảnh)
 * @param {string} userId ID người nhận
 * @param {string} action 'typing' hoặc 'upload_photo'
 */
export const sendChatAction = async (userId, action = 'typing') => {
  const botToken = config.zalo.botToken;
  if (!botToken) return;

  const ZALO_API_URL = `https://bot-api.zaloplatforms.com/bot${botToken}/sendChatAction`;
  try {
    await axios.post(ZALO_API_URL, { chat_id: userId, action }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
  } catch (error) {
    logger.warn({ err: error.response?.data || error.message, userId, action }, 'Failed to send chat action');
  }
};

/**
 * Gửi ảnh qua Zalo Bot Platform API
 * @param {string} userId ID người nhận
 * @param {string} photoUrl Đường dẫn ảnh
 * @param {string} caption Chú thích ảnh (tùy chọn)
 */
export const sendPhoto = async (userId, photoUrl, caption = '') => {
  const botToken = config.zalo.botToken;
  if (!botToken) throw new Error('Missing ZALO_BOT_TOKEN');

  const ZALO_API_URL = `https://bot-api.zaloplatforms.com/bot${botToken}/sendPhoto`;
  const payload = { chat_id: userId, photo: photoUrl };
  if (caption) payload.caption = truncate(caption, 2000);

  try {
    const response = await axios.post(ZALO_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const data = response.data;
    if (!data.ok) {
      throw new Error(`Zalo API error: ${data.description || 'Unknown error'}`);
    }
    return data;
  } catch (error) {
    logger.error({ err: error.response?.data || error, userId }, 'Failed to send photo');
    throw error;
  }
};
