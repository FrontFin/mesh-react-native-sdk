import { isValidUrl } from '../utils';

describe('isValidUrl function', () => {
  // Test cases for valid URLs
  test('should return true for a valid URL', () => {
    const validUrls = [
      'https://web.getfront.com/b2b-iframe/',
      'https://web.getfront.com/broker-connect',
      'https://web.getfront.com:443/b2b-iframe',
      'https://web.getfront.com:443/broker-connect',
      'https://www.meshconnect.com/',
      'https://meshconnect.com'
    ];

    validUrls.forEach((url) => {
      expect(isValidUrl(url)).toBe(true);
    });
  });

  // Test cases for invalid URLs
  test('should return false for an invalid URL', () => {
    const invalidUrls = [
      null,
      'not a URL',
      'www.no-protocol.com',
      'invalid-domain.com'
    ];

    invalidUrls.forEach((url) => {
      expect(isValidUrl(url)).toBe(false);
    });
  });
});
