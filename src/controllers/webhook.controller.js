import { addMessageJob } from '../services/queue.service.js';
import logger from '../utils/logger.js';

export const handleWebhook = async (req, res) => {
  try {
    const { message } = req.body;

    // Xác định sự kiện: nếu có message và có text
    if (message && message.text) {
      const chatId = message.chat?.id;
      const msgId = message.message_id;

      logger.info({ userId: chatId, msgId }, 'Received user message');
      
      // Đẩy vào queue để xử lý background
      await addMessageJob(req.body);
    } else {
      logger.debug('Ignored non-text event');
    }

    // Luôn trả 200 OK ngay lập tức (Ack-then-process)
    return res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error({ err: error }, 'Controller error handling webhook');
    // Vẫn trả 200 để tránh Zalo retry liên tục khi hệ thống lỗi
    return res.status(200).json({ ok: false, description: 'Internal Server Error' });
  }
};
