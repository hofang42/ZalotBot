import { describe, it, expect } from 'vitest';
import { filterOutput } from '../src/utils/contentFilter.js';
import { sanitizeInput, truncate } from '../src/utils/sanitize.js';

describe('Gemini Content Filter', () => {
  it('should return normal text as is', () => {
    const text = 'Xin chào, tôi có thể giúp gì cho bạn?';
    expect(filterOutput(text)).toBe(text);
  });

  it('should block forbidden keywords', () => {
    const text = 'Đây là hướng dẫn hack website...';
    expect(filterOutput(text)).toBe('Xin lỗi, nội dung này vi phạm chính sách hỗ trợ của tôi.');
  });
});

describe('Input Sanitize', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('   hello world   ')).toBe('hello world');
  });

  it('should remove control characters', () => {
    // \x00 is null char
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });

  it('should truncate long text safely', () => {
    const text = 'abcdef';
    expect(truncate(text, 3)).toBe('abc...');
  });

  it('should keep emoji correctly when truncating', () => {
    // Emoji take multiple bytes, Array.from should handle it
    const text = '👨‍👩‍👧‍👦abc';
    // vitest assert
    const result = truncate(text, 1);
    expect(result.length).toBeGreaterThan(0);
  });
});
