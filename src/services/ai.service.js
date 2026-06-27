import Groq from 'groq-sdk';
import config from '../config/index.js';
import { AI_CONFIG } from '../config/constants.js';
import { SYSTEM_INSTRUCTION } from '../prompts/systemInstruction.js';
import logger from '../utils/logger.js';

let groqAi;

try {
  groqAi = new Groq({ apiKey: config.groq.apiKey });
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Groq client');
}

async function callGroqVision(userMessage, photoUrl, history, onFallback) {
  if (!groqAi) throw new Error('Groq client not initialized');

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    })),
    {
      role: 'user',
      content: [
        { type: 'text', text: userMessage || 'Hãy mô tả hoặc trả lời câu hỏi về bức ảnh này.' },
        { type: 'image_url', image_url: { url: photoUrl } }
      ]
    }
  ];

  let lastError;

  for (const model of AI_CONFIG.GROQ_VISION_MODELS) {
    try {
      logger.debug(`Calling Groq API for Vision (${model})`);

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
      });

      const groqPromise = groqAi.chat.completions.create({
        messages,
        model: model,
        max_completion_tokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      });

      const response = await Promise.race([groqPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      return response.choices[0]?.message?.content;
    } catch (error) {
      lastError = error;
      logger.warn({ model, err: error.message, status: error.status }, 'Groq vision model failed, trying next...');
      // Continue to next model if timeout, rate limit, or server errors
      const isRecoverable = error.message === 'AbortError' || [413, 429, 500, 502, 503, 504].includes(error.status);
      if (!isRecoverable) {
        throw error;
      }
      if (onFallback) await onFallback(model);
    }
  }

  throw lastError;
}

async function callGroqText(userMessage, history, onFallback) {
  if (!groqAi) throw new Error('Groq client not initialized');

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  let lastError;

  for (const model of AI_CONFIG.GROQ_MODELS) {
    try {
      logger.debug(`Calling Groq API for Text (${model})`);

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
      });

      const groqPromise = groqAi.chat.completions.create({
        messages,
        model: model,
        max_completion_tokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      });

      const response = await Promise.race([groqPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      return response.choices[0]?.message?.content;
    } catch (error) {
      lastError = error;
      logger.warn({ model, err: error.message, status: error.status }, 'Groq text model failed, trying next...');
      // Continue to next model if timeout, rate limit, or server errors
      const isRecoverable = error.message === 'AbortError' || [413, 429, 500, 502, 503, 504].includes(error.status);
      if (!isRecoverable) {
        throw error;
      }
      if (onFallback) await onFallback(model);
    }
  }

  throw lastError;
}

/**
 * Gọi AI (Groq Qwen cho ảnh, Groq Llama cho text)
 */
export const generateResponse = async (userMessage, photoUrl = null, history = [], onFallback = null) => {
  try {
    let replyText;
    
    if (photoUrl) {
      replyText = await callGroqVision(userMessage, photoUrl, history, onFallback);
    } else {
      replyText = await callGroqText(userMessage, history, onFallback);
    }
    
    if (!replyText) {
      logger.warn('AI returned empty text');
      return 'Xin lỗi, tôi không thể xử lý yêu cầu này.';
    }

    return replyText;
  } catch (error) {
    if (error.message === 'AbortError') {
      logger.error('AI API timeout');
      return 'Xin lỗi, hệ thống đang quá tải và phản hồi chậm. Vui lòng thử lại sau.';
    }
    
    logger.error({ err: error, status: error.status, message: error.message }, 'AI API Error Catch Block');
    if (error?.status === 429) {
      return 'Xin lỗi, hệ thống đang xử lý quá nhiều yêu cầu cùng lúc. Vui lòng thử lại sau ít phút.';
    }

    return 'Đã xảy ra lỗi khi kết nối với hệ thống AI. Vui lòng thử lại sau.';
  }
};
