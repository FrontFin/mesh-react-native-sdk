import { decode64, encode64 } from '../utils';

describe('decode64 function', () => {
  it('should decode a base64-encoded string', () => {
    const encodedString = 'SGVsbG8gV29ybGQ='; // "Hello World" encoded in base64
    const decodedString = decode64(encodedString);

    expect(decodedString).toBe('Hello World');
  });

  it('should handle edge cases', () => {
    expect(() => decode64('')).not.toThrow();

    expect(() => decode64('InvalidBase64$*7')).toThrow(Error);
  });

  // Both codecs loop with do...while, so empty input used to run one iteration
  // and emit padding for characters that were never there.
  it('returns an empty string for empty input, not NUL bytes', () => {
    expect(decode64('')).toBe('');
  });
});

describe('encode64 function', () => {
  it('returns an empty string for empty input, not AA==', () => {
    expect(encode64('')).toBe('');
  });

  it('matches base64 for every padding remainder', () => {
    expect(encode64('a')).toBe('YQ==');
    expect(encode64('ab')).toBe('YWI=');
    expect(encode64('abc')).toBe('YWJj');
    expect(encode64('abcd')).toBe('YWJjZA==');
  });

  it('round-trips through decode64', () => {
    for (const value of ['', 'a', 'ab', 'abc', 'https://link.meshpay.com/']) {
      expect(decode64(encode64(value))).toBe(value);
    }
  });

  it('rejects non-ASCII rather than mangling it', () => {
    expect(() => encode64('é')).toThrow(Error);
  });
});
