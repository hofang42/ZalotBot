import 'dotenv/config';
import { generateResponse } from './src/services/ai.service.js';

async function test() {
  console.log('Testing fallback logic...');
  try {
    const res = await generateResponse('mẹ đây', null, []);
    console.log('Result:', res);
  } catch (error) {
    console.error('Final Error:', error);
  }
}
test();
