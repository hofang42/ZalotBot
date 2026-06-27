import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test(modelName) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: 'Hello'
    });
    console.log(`Success ${modelName}:`, res.text);
  } catch (err) {
    console.error(`Error ${modelName}:`, err.message);
  }
}

async function run() {
  await test('gemini-3.5-flash');
  await test('gemini-2.5-flash');
}
run();
