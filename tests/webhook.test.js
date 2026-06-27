import { describe, it, expect, vi } from 'vitest';
import { validatePayload } from '../src/middlewares/validatePayload.js';
import { handleWebhook } from '../src/controllers/webhook.controller.js';

vi.mock('../src/services/queue.service.js', () => ({
  addMessageJob: vi.fn()
}));

describe('Webhook Validation (ZBP)', () => {
  it('should pass valid text message payload', () => {
    const req = {
      body: {
        ok: true,
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: "msg1",
            chat: { id: "user1" },
            text: "Hello",
            date: 123456789
          }
        }
      }
    };
    const res = {};
    const next = vi.fn();

    validatePayload(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid payload without event_name', () => {
    const req = {
      body: {
        ok: true,
        result: {
          message: {
            message_id: "msg1",
            text: "Hello"
          }
        }
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    validatePayload(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Webhook Controller (ZBP)', () => {
  it('should return 200 OK immediately and enqueue job', async () => {
    const req = {
      body: {
        ok: true,
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: "msg1",
            chat: { id: "user1" },
            text: "Hello"
          }
        }
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const { addMessageJob } = await import('../src/services/queue.service.js');
    
    await handleWebhook(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(addMessageJob).toHaveBeenCalledWith(req.body.result);
  });
});
