import logger from '../utils/logger.js';
import { sanitizeInput } from '../utils/sanitize.js';
import { getHistory, addToHistory } from '../services/conversation.service.js';
import { generateResponse } from '../services/groq.service.js';
import { sendTextMessage, sendChatAction } from '../services/zalo.service.js';
import { filterOutput } from '../utils/contentFilter.js';

export const processMessageJob = async (job) => {
  const payload = job.data;
  const { event_name, message } = payload;
  
  if (!message) {
    return;
  }

  const userId = message.chat?.id;
  const rawText = message.text || message.caption || '';
  
  // Zalo Bot Platform có thể trả ảnh ở message.photo hoặc message.attachments
  let photoUrl = message.photo;
  if (!photoUrl && message.attachments && message.attachments.length > 0) {
    const imgAttachment = message.attachments.find(a => a.type === 'image' || a.type === 'photo');
    if (imgAttachment && imgAttachment.payload && imgAttachment.payload.url) {
      photoUrl = imgAttachment.payload.url;
    }
  }

  if (!photoUrl && event_name === 'message.image.received') {
    photoUrl = 'IMAGE_RECEIVED_BUT_NO_URL';
  }

  logger.info({ userId, event_name, hasPhoto: photoUrl !== 'IMAGE_RECEIVED_BUT_NO_URL' }, 'Processing message job');

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
    let aiResponse;
    if (photoUrl === 'IMAGE_RECEIVED_BUT_NO_URL') {
      const debugInfo = JSON.stringify(message).substring(0, 1000); // Truncate just in case
      aiResponse = await generateResponse(`Mẹ ơi, hệ thống nhận được ảnh nhưng cấu trúc dữ liệu bị lỗi hoặc khác với tài liệu của Zalo. Đây là dữ liệu ẩn (chỉ dùng để con sửa lỗi): ${debugInfo}`, null, history);
    } else {
      aiResponse = await generateResponse(cleanText, photoUrl, history);
    }
    
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
