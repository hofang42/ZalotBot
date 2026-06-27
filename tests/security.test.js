import { describe, it, expect, vi } from 'vitest';
import { verifyZaloSecret } from '../src/middlewares/verifyZaloSecret.js';

vi.mock('../src/config/index.js', () => ({
  default: {
    zalo: {
      webhookSecret: 'test_token_123'
    }
  }
}));

describe('Security - Verify Secret (ZBP)', () => {
  it('should pass with correct secret token in header', () => {
    const req = {
      headers: {
        'x-bot-api-secret-token': 'test_token_123'
      }
    };
    const res = {};
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 with missing secret token', () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 with incorrect secret token', () => {
    const req = {
      headers: {
        'x-bot-api-secret-token': 'wrong_token'
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    verifyZaloSecret(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
