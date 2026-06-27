import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import axios from 'axios';
import config from '../config/index.js';
import { AI_CONFIG } from '../config/constants.js';
import { SYSTEM_INSTRUCTION } from '../prompts/systemInstruction.js';
import logger from '../utils/logger.js';

let geminiAi;
let groqAi;

try {
  geminiAi = new GoogleGenAI({ apiKey: config.gemini.apiKey });
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Gemini client');
}

try {
  groqAi = new Groq({ apiKey: config.groq.apiKey });
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Groq client');
}

/**
 * Tải ảnh từ URL thành base64 để gửi cho Gemini
 */
async function fetchImageBase64(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const base64 = buffer.toString('base64');
    let mimeType = response.headers['content-type'] || 'image/jpeg';
    return { inlineData: { data: base64, mimeType } };
  } catch (error) {
    logger.error({ err: error, url }, 'Failed to fetch image for Gemini');
    return null;
  }
}

async function callGeminiVision(userMessage, photoUrl, history) {
  if (!geminiAi) throw new Error('Gemini client not initialized');

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  let contents = [...formattedHistory];
  let userParts = [];
  
  const imageData = await fetchImageBase64(photoUrl);
  if (imageData) {
    userParts.push(imageData);
  }
  userParts.push({ text: userMessage || 'Hãy mô tả hoặc trả lời câu hỏi về bức ảnh này.' });
  
  contents.push({ role: 'user', parts: userParts });

  logger.debug('Calling Gemini API for Vision');

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
  });

  const geminiPromise = geminiAi.models.generateContent({
    model: AI_CONFIG.GEMINI_VISION_MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
    }
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);
  return response.text;
}

async function callGroqText(userMessage, history) {
  if (!groqAi) throw new Error('Groq client not initialized');

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  logger.debug('Calling Groq API for Text');

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AbortError')), AI_CONFIG.TIMEOUT_MS);
  });

  const groqPromise = groqAi.chat.completions.create({
    messages,
    model: AI_CONFIG.GROQ_MODEL,
    max_completion_tokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
    temperature: 0.7,
  });

  const response = await Promise.race([groqPromise, timeoutPromise]);
  return response.choices[0]?.message?.content;
}

/**
 * Gọi AI (Gemini cho ảnh, Groq cho text)
 */
export const generateResponse = async (userMessage, photoUrl = null, history = []) => {
  try {
    let replyText;
    
    if (photoUrl) {
      replyText = await callGeminiVision(userMessage, photoUrl, history);
    } else {
      replyText = await callGroqText(userMessage, history);
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
    
    logger.error({ err: error }, 'AI API Error');
    if (error?.status === 429) {
      return 'Xin lỗi, hệ thống đang xử lý quá nhiều yêu cầu cùng lúc. Vui lòng thử lại sau ít phút.';
    }

    return 'Đã xảy ra lỗi khi kết nối với hệ thống AI. Vui lòng thử lại sau.';
  }
};
