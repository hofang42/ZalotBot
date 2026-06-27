# Zalo AI Chatbot (ZBP + Gemini)

Production-grade Zalo AI Chatbot tích hợp Google Gemini AI, được thiết kế theo nguyên tắc "Ack-then-process" (xác nhận trước, xử lý sau) để tránh timeout webhook của Zalo.

## Kiến trúc hệ thống
- **Webhook**: Express.js
- **Queue**: BullMQ + Redis
- **AI**: `@google/genai` (Gemini 2.0 Flash)
- **Security**: Timing-safe verification, Rate limiting, Payload validation

## Cấu hình
Copy file `.env.example` thành `.env` và điền các thông tin:
- `ZALO_BOT_SECRET_TOKEN`: Lấy từ Zalo OA Developers
- `ZALO_OA_ACCESS_TOKEN`: Token để gọi API gửi tin nhắn
- `ZALO_APP_ID`, `ZALO_APP_SECRET`: App credentials
- `GEMINI_API_KEY`: Lấy từ Google AI Studio
- `REDIS_URL`: URL kết nối Redis

## Chạy Local (Development)
Yêu cầu: Node.js 20+, Redis chạy local.

```bash
# Cài đặt
npm install

# Khởi động Redis bằng Docker (nếu chưa có)
docker run -d -p 6379:6379 redis:7

# Chạy app
npm run dev
```

Sử dụng ngrok để expose port 3000 ra public và cấu hình webhook URL trên Zalo.

## Deploy Vercel
Dự án được tối ưu để chạy trên Vercel Serverless. Push code lên main branch, GitHub Actions sẽ tự động deploy (cần cấu hình Vercel token trong GitHub Secrets).
