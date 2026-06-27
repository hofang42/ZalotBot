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
  
  // Zalo Bot Platform có thể trả ảnh ở nhiều trường khác nhau
  let photoUrl = message.photo || message.image || message.url || message.image_url || message.file_url;
  if (!photoUrl && message.attachments && Array.isArray(message.attachments)) {
    const imgAttachment = message.attachments.find(a => a.type === 'image' || a.type === 'photo');
    if (imgAttachment) {
      photoUrl = imgAttachment.url || imgAttachment.payload?.url || imgAttachment.payload?.thumbnail;
    } else if (message.attachments[0]) {
      photoUrl = message.attachments[0].url || message.attachments[0].payload?.url;
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

    if (photoUrl === 'IMAGE_RECEIVED_BUT_NO_URL') {
      // Thay vì gửi vào Groq để AI đóng vai, ta gửi trực tiếp cho người dùng luôn
      const debugInfo = JSON.stringify(message).substring(0, 500);
      await sendTextMessage(userId, `mẹ ơi con nhận được ảnh rồi mà Zalo gửi qua bị lỗi chi đó con không coi được hình. Mẹ thử gửi lại nha. (Lỗi ẩn: ${debugInfo})`);
      return;
    }

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
