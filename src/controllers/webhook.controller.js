import { addMessageJob } from '../services/queue.service.js';
import logger from '../utils/logger.js';

/**
 * Handle incoming webhook from Zalo Bot Platform
 */
export const handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const { event_name, message } = payload;

    const isTextMessage = event_name === 'message.text.received' && message?.text;
    const isImageMessage = event_name === 'message.image.received';

    // Chỉ xử lý sự kiện có message text hoặc image
    if (isTextMessage || isImageMessage) {
      if (isImageMessage && !message?.photo) {
        logger.info({ message }, 'Image message received but no photo field detected');
      }
      const chatId = message?.chat?.id;
      const msgId = message?.message_id;

      logger.info({ userId: chatId, msgId, isImage: isImageMessage }, 'Received user message');
      
      // Đẩy nguyên payload của event vào queue
      await addMessageJob(payload);
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
