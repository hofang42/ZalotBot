import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello'
    });
    console.log('Success:', res.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
