import { describe, expect, it } from 'vitest';
import { parseApiUrl } from './env';

describe('parseApiUrl', () => {
  it('treats empty or unset as same origin', () => {
    expect(parseApiUrl(undefined)).toBe('');
    expect(parseApiUrl('')).toBe('');
    expect(parseApiUrl('   ')).toBe('');
  });

  it('accepts http(s) URLs and strips trailing slashes', () => {
    expect(parseApiUrl('http://localhost:4000')).toBe('http://localhost:4000');
    expect(parseApiUrl('https://api.example.com/')).toBe('https://api.example.com');
    expect(parseApiUrl(' https://api.example.com/base// ')).toBe('https://api.example.com/base');
  });

  it('rejects relative, non-http and query-carrying values', () => {
    expect(() => parseApiUrl('api.example.com')).toThrow(/absolute URL/);
    expect(() => parseApiUrl('ftp://api.example.com')).toThrow(/http or https/);
    expect(() => parseApiUrl('https://api.example.com?x=1')).toThrow(/query string/);
  });
});
