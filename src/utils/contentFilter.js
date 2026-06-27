import logger from './logger.js';

/**
 * Lọc nội dung sinh ra từ AI để đảm bảo an toàn.
 * Gemini Safety Settings đã chặn phần lớn, nhưng cần thêm một lớp tự vệ cục bộ.
 */
export const filterOutput = (text) => {
  if (!text) return 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

  // Ví dụ: regex đơn giản lọc email hoặc sđt nếu không được phép
  // const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
  // if (phoneRegex.test(text)) {
  //   logger.warn('Blocked output containing phone number');
  //   return 'Xin lỗi, tôi không thể cung cấp số điện thoại hoặc thông tin cá nhân.';
  // }

  // Các rule tùy chỉnh cho thương hiệu của bạn
  const forbiddenKeywords = ['hack', 'lừa đảo', 'phạm pháp'];
  const lowerText = text.toLowerCase();
  
  for (const keyword of forbiddenKeywords) {
    if (lowerText.includes(keyword)) {
      logger.warn({ keyword }, 'Blocked output due to forbidden keyword');
      return 'Xin lỗi, nội dung này vi phạm chính sách hỗ trợ của tôi.';
    }
  }

  return text;
};
