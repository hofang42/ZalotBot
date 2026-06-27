import Groq from 'groq-sdk';
import config from '../config/index.js';
import { GROQ_CONFIG } from '../config/constants.js';
import { SYSTEM_INSTRUCTION } from '../prompts/systemInstruction.js';
import logger from '../utils/logger.js';

let groq;
try {
  groq = new Groq({ apiKey: config.groq.apiKey });
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Groq client');
}

/**
 * Gọi Groq API với context
 */
export const generateResponse = async (userMessage, history = []) => {
  if (!groq) {
    logger.error('Groq API client not initialized');
    return 'Xin lỗi, dịch vụ AI hiện không khả dụng.';
  }

  try {
    // Format messages for Groq/OpenAI compatible API
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    logger.debug('Calling Groq API');

    // Chạy với Promise.race để implement timeout vì groq-sdk fetch mặc định có thể treo
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AbortError')), GROQ_CONFIG.TIMEOUT_MS);
    });

    const groqPromise = groq.chat.completions.create({
      messages,
      model: GROQ_CONFIG.MODEL,
      max_completion_tokens: GROQ_CONFIG.MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    });

    const response = await Promise.race([groqPromise, timeoutPromise]);

    const replyText = response.choices[0]?.message?.content;
    
    if (!replyText) {
      logger.warn({ response }, 'Groq returned empty text');
      return 'Xin lỗi, tôi không thể xử lý yêu cầu này.';
    }

    return replyText;
  } catch (error) {
    if (error.message === 'AbortError') {
      logger.error('Groq API timeout');
      return 'Xin lỗi, hệ thống đang quá tải và phản hồi chậm. Vui lòng thử lại sau.';
    }
    
    logger.error({ err: error }, 'Groq API Error');
    // Handle specific Groq errors like rate limits
    if (error?.status === 429) {
      return 'Xin lỗi, hệ thống đang xử lý quá nhiều yêu cầu cùng lúc. Vui lòng thử lại sau ít phút.';
    }

    return 'Đã xảy ra lỗi khi kết nối với hệ thống AI. Vui lòng thử lại sau.';
  }
};
