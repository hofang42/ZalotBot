import Groq from 'groq-sdk';
import 'dotenv/config';

async function test() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const res = await groq.chat.completions.create({
      model: 'qwen/qwen3.6-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Nhìn ảnh này đi' },
            { type: 'image_url', image_url: { url: 'https://photo-stal-34.zdn.vn/gr/jpg/e6c3cb41ce920bcc5283/2aOboQgSRQTqq8KMZ7MIS001Hzt0Mf459usPk8fI.jpg' } }
          ]
        }
      ],
      max_completion_tokens: 1024
    });
    console.log('Success:', res.choices[0]?.message?.content);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
