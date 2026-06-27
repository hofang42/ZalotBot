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

export const GROQ_CONFIG = {
  // Llama 3.3 70B is highly recommended for reasoning on Groq
  MODEL: 'llama-3.3-70b-versatile',
  // Vision model for handling image inputs
  VISION_MODEL: 'llama-3.2-90b-vision-preview',
  MAX_OUTPUT_TOKENS: 1024,
  TIMEOUT_MS: 15000,
};

export const CONVERSATION = {
  HISTORY_TTL_SECONDS: 3600, // 1 hour
  MAX_HISTORY_MESSAGES: 10,
};

export const QUEUE = {
  NAME: 'zalo-messages',
  IDEMPOTENCY_TTL_SECONDS: 300, // 5 minutes
};
