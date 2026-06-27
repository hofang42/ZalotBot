import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';
import { verifyZaloSecret } from '../middlewares/verifyZaloSecret.js';
import { validatePayload } from '../middlewares/validatePayload.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Zalo Bot Platform webhook thường dùng URL có chứa token để bảo mật
router.post(
  '/:botToken',
  verifyZaloSecret,
  validatePayload,
  rateLimiter,
  handleWebhook
);

export default router;
