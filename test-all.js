import 'dotenv/config';
import Groq from 'groq-sdk';
import { AI_CONFIG } from './src/config/constants.js';

async function testAllModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  for (const model of AI_CONFIG.GROQ_MODELS) {
    try {
      console.log(`Testing model ${model}...`);
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'hello' }],
        model: model,
        max_completion_tokens: 10
      });
      console.log(`Success ${model}:`, res.choices[0].message.content);
    } catch (err) {
      console.error(`Failed ${model}:`, err.message);
    }
  }
}
testAllModels();
