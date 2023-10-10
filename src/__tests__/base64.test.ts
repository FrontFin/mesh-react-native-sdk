import { decode64 } from '../utils';

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
});
