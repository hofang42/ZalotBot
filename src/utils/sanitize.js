import { INPUT_LIMITS } from '../config/constants.js';

/**
 * Xóa khoảng trắng thừa, cắt bớt nếu quá dài
 */
export const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  
  let cleanText = text.trim();
  
  // Xóa các ký tự điều khiển (Control characters)
  // eslint-disable-next-line no-control-regex
  cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  return truncate(cleanText, INPUT_LIMITS.MAX_MESSAGE_LENGTH);
};

/**
 * Cắt text an toàn (giữ được emoji)
 */
export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  
  let result = '';
  const targetLength = Math.max(0, maxLength - 3);
  
  for (const char of Array.from(text)) {
    if (result.length + char.length > targetLength) break;
    result += char;
  }
  
  return result + '...';
};
