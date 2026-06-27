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
  
  // Dùng Array.from để đếm đúng số lượng ký tự Unicode (emoji)
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  
  return chars.slice(0, Math.max(0, maxLength - 3)).join('') + '...';
};
