import Groq from 'groq-sdk';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import OpenAI from 'openai';
import config from '../config/index.js';
import { AI_CONFIG } from '../config/constants.js';
import { SYSTEM_INSTRUCTION } from '../prompts/systemInstruction.js';
import logger from '../utils/logger.js';

let groqAi;
let cerebrasAi;
let cloudflareAi;

try {
  groqAi = new Groq({ apiKey: config.groq.apiKey });
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Groq client');
}

try {
  if (config.cerebras?.apiKey) {
    cerebrasAi = new Cerebras({ apiKey: config.cerebras.apiKey });
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Cerebras client');
}

try {
  if (config.cloudflare?.apiToken && config.cloudflare?.accountId) {
    cloudflareAi = new OpenAI({
      apiKey: config.cloudflare.apiToken,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/ai/v1`,
    });
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Cloudflare client');
}

async function callVision(userMessage, photoUrl, history, onFallback) {
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

  for (const modelStr of AI_CONFIG.VISION_MODELS) {
    try {
      const isCloudflare = modelStr.startsWith('cloudflare/');
      const actualModel = modelStr.replace('cloudflare/', '');
      
      let client = groqAi;
      let providerName = 'Groq';
      if (isCloudflare) { client = cloudflareAi; providerName = 'Cloudflare'; }

      if (!client) {
        logger.warn(`${providerName} client not initialized, skipping model ${modelStr}`);
        continue;
      }

      logger.debug(`Calling AI API for Vision (${modelStr})`);

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
      });

      const aiPromise = client.chat.completions.create({
        messages,
        model: actualModel,
        max_tokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      });

      const response = await Promise.race([aiPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      logger.info({ successfulModel: actualModel, provider: providerName }, 'AI vision request succeeded');
      return response.choices[0]?.message?.content;
    } catch (error) {
      lastError = error;
      logger.warn({ model: modelStr, err: error.message, status: error.status }, 'AI vision model failed, trying next...');
      // Continue to next model if timeout, rate limit, auth errors, bad requests, or server errors
      const isRecoverable = error.message === 'AbortError' || [400, 401, 403, 404, 413, 429, 500, 502, 503, 504].includes(error.status);
      if (!isRecoverable) {
        throw error;
      }
      if (onFallback) await onFallback(modelStr);
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

  for (const modelStr of AI_CONFIG.TEXT_MODELS) {
    try {
      const isCerebras = modelStr.startsWith('cerebras/');
      const isCloudflare = modelStr.startsWith('cloudflare/');
      
      const actualModel = modelStr.replace('cerebras/', '').replace('cloudflare/', '');
      
      let client = groqAi;
      let providerName = 'Groq';
      if (isCerebras) { client = cerebrasAi; providerName = 'Cerebras'; }
      if (isCloudflare) { client = cloudflareAi; providerName = 'Cloudflare'; }

      if (!client) {
        logger.warn(`${providerName} client not initialized, skipping model ${modelStr}`);
        continue;
      }

      logger.debug(`Calling AI API for Text (${modelStr})`);

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
      });

      const aiPromise = client.chat.completions.create({
        messages,
        model: actualModel,
        max_tokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      });

      const response = await Promise.race([aiPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      logger.info({ successfulModel: actualModel, provider: providerName }, 'AI request succeeded');
      return response.choices[0]?.message?.content;
    } catch (error) {
      lastError = error;
      logger.warn({ model: modelStr, err: error.message, status: error.status }, 'AI text model failed, trying next...');
      // Continue to next model if timeout, rate limit, auth errors, bad requests, or server errors
      const isRecoverable = error.message === 'AbortError' || [400, 401, 403, 404, 413, 429, 500, 502, 503, 504].includes(error.status);
      if (!isRecoverable) {
        throw error;
      }
      if (onFallback) await onFallback(modelStr);
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
      replyText = await callVision(userMessage, photoUrl, history, onFallback);
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
