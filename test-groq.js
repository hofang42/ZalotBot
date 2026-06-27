import { generateResponse } from './src/services/groq.service.js';

async function test() {
  console.log('Testing Groq Vision...');
  const res = await generateResponse('Nhìn ảnh này đi', 'https://photo-stal-34.zdn.vn/gr/jpg/e6c3cb41ce920bcc5283/2aOboQgSRQTqq8KMZ7MIS001Hzt0Mf459usPk8fI.jpg');
  console.log('Response:', res);
}

test();
