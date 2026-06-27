import logger from '../utils/logger.js';
import { sanitizeInput } from '../utils/sanitize.js';
import { getHistory, addToHistory } from '../services/conversation.service.js';
import { generateResponse } from '../services/groq.service.js';
import { sendTextMessage, sendChatAction } from '../services/zalo.service.js';
import { filterOutput } from '../utils/contentFilter.js';

export const processMessageJob = async (job) => {
  const { message } = job.data;
  
  if (!message || (!message.text && !message.photo)) {
    return;
  }

  const userId = message.chat.id;
  const rawText = message.text || message.caption || '';
  const photoUrl = message.photo;

  logger.info({ userId }, 'Processing message job');

  try {
    const cleanText = sanitizeInput(rawText);
    if (!cleanText && !photoUrl) {
      await sendTextMessage(userId, "Xin lỗi, tôi không hiểu tin nhắn của bạn.");
      return;
    }

    // Báo cho Zalo biết Bot đang xử lý
    await sendChatAction(userId, 'typing');

    const history = await getHistory(userId);
    
    // Gọi Groq Service
    const aiResponse = await generateResponse(cleanText, photoUrl, history);
    
    const safeResponse = filterOutput(aiResponse);
    
    await sendTextMessage(userId, safeResponse);
    
    await addToHistory(userId, cleanText, safeResponse);

  } catch (error) {
    logger.error({ err: error, userId }, 'Error in message processing pipeline');
    
    try {
      await sendTextMessage(userId, "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
    } catch (e) {
      logger.error({ err: e }, 'Failed to send error fallback message');
    }
    
    throw error;
  }
};
