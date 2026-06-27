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
  // Llama 3.3 70B is highly recommended for reasoning on Groq
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  // Qwen vision model for handling image inputs on Groq
  GROQ_VISION_MODEL: 'qwen/qwen3.6-27b',
  MAX_OUTPUT_TOKENS: 1024,
  TIMEOUT_MS: 20000,
};

export const CONVERSATION = {
  HISTORY_TTL_SECONDS: 3600, // 1 hour
  MAX_HISTORY_MESSAGES: 10,
};

export const QUEUE = {
  NAME: 'zalo-messages',
  IDEMPOTENCY_TTL_SECONDS: 300, // 5 minutes
};
