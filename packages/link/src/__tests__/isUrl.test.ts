import { isValidUrl } from '../utils'

describe('isValidUrl function', () => {
  // Test cases for valid URLs
  test('should return true for a valid URL', () => {
    const validUrls = ['http://example.com', 'https://example.com/']

    validUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(true)
    })
  })

  // Test cases for invalid URLs
  test('should return false for an invalid URL', () => {
    const invalidUrls = [
      null,
      'not a URL',
      'www.no-protocol.com',
      'invalid-domain.com'
    ]

    invalidUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(false)
    })
  })
})
