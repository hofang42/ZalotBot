import 'dotenv/config';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  zalo: {
    // Với Zalo Bot Platform (giống Telegram), chỉ cần BOT_TOKEN
    botToken: requireEnv('ZALO_BOT_TOKEN'),
  },

  groq: {
    apiKey: requireEnv('GROQ_API_KEY'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }
};

export default Object.freeze(config);
