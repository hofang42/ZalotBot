export const RATE_LIMIT = {
  SHORT_TERM: {
    POINTS: 5,         // 5 messages
    DURATION: 10,      // per 10 seconds
  },
  LONG_TERM: {
    POINTS: 100,       // 100 messages
    DURATION: 3600,    // per 1 hour
  }
};

export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
};

export const AI_CONFIG = {
  // Fallback text models: High to low priority
  TEXT_MODELS: [
    'cloudflare/@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    'cerebras/llama3.1-8b',
    'cerebras/llama-3.3-70b',
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'groq/compound',
    'groq/compound-mini',
    'allam-2-7b'
  ],
  // Vision models
  VISION_MODELS: [
    'cloudflare/@cf/meta/llama-3.2-11b-vision-instruct',
    'cloudflare/@cf/meta/llama-4-scout-17b-16e-instruct',
    'cloudflare/@cf/google/gemma-4-26b-a4b-it',
    'qwen/qwen3.6-27b'
  ],
  MAX_OUTPUT_TOKENS: 1024,
  TIMEOUT_MS: 20000,
};

export const CONVERSATION = {
  HISTORY_TTL_SECONDS: 3600, // 1 hour
  MAX_HISTORY_MESSAGES: 5,
};

export const QUEUE = {
  NAME: 'zalo-messages',
  IDEMPOTENCY_TTL_SECONDS: 300, // 5 minutes
};
