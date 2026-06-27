import { addMessageJob } from '../services/queue.service.js';
import logger from '../utils/logger.js';

/**
 * Handle incoming webhook from Zalo Bot Platform
 */
export const handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const { event_name, message } = payload.result || {};

    // Chỉ xử lý sự kiện có message text
    if (event_name === 'message.text.received' && message && message.text) {
      const chatId = message.chat?.id;
      const msgId = message.message_id;

      logger.info({ userId: chatId, msgId }, 'Received user text message');
      
      // Đẩy nguyên payload của event vào queue
      await addMessageJob(payload.result);
    } else {
      logger.debug({ event_name }, 'Ignored non-text or unsupported event');
    }

    // Luôn trả về 200 OK để Zalo biết đã nhận được
    return res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error({ err: error }, 'Controller error handling webhook');
    return res.status(200).json({ ok: false, description: 'Internal Server Error' });
  }
};
