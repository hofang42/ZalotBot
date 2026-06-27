import { describe, it, expect, vi } from 'vitest';
import { verifyZaloSecret } from '../src/middlewares/verifyZaloSecret.js';

vi.mock('../src/config/index.js', () => ({
  default: {
    zalo: {
      botToken: 'bot_token_123'
    }
  }
}));

describe('Security - Verify Secret (ZBP)', () => {
  it('should pass with correct bot token in path', () => {
    const req = {
      params: {
        botToken: 'bot_token_123'
      }
    };
    const res = {};
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 with missing bot token', () => {
    const req = { params: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with incorrect bot token', () => {
    const req = {
      params: {
        botToken: 'wrong_token'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
