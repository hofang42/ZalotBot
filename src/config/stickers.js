/**
 * Danh sách ID hoặc URL của sticker tương ứng với các cảm xúc.
 * Lưu ý: Thay thế các placeholder bên dưới bằng ID/URL thật từ stickers.zaloapp.com
 */
export const STICKER_MAP = {
  'HAPPY': 'ce6e95b5a9f040ae19e1', // Chứng Chất Cùng Smarty
  'LOVE': '790d30d60c93e5cdbc82',  // Bé Hai Hybear
  'SAD': '343669ed55a8bcf6e5b9',   // Bình Hưng Hòa Xanh
  'LAUGH': '2cc66c1d5058b906e049', // Cò Lõ Đi Làm Ổnt Mà
  'CRY': 'b61ff1c4cd8124df7d90',   // KAI Mood
  'WOW': 'ce6e95b5a9f040ae19e1',
  'THINK': '2cc66c1d5058b906e049',
};

/**
 * Hàm lấy sticker ngẫu nhiên hoặc mặc định nếu không có
 */
export const getStickerUrl = (keyword) => {
  const upperKey = keyword?.toUpperCase();
  return STICKER_MAP[upperKey] || null;
};
