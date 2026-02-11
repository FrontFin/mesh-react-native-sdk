import { addURLParam, urlSearchParams } from '../utils';

describe('urlSearchParams function', () => {
  test('should parse query parameters for URLs', () => {
    const urls: Record<string, Record<string, string>> = {
      'https://example.com': {},
      'https://example.com?foo=bar&baz=qux': { baz: 'qux', foo: 'bar' },
      'https://example.com?foo=bar#anchor=ignored': { foo: 'bar' },
      'https://example.com?search=query&sort': { search: 'query' },
      'https://example.com?test%20encoded=value': { 'test encoded': 'value' },
      'https://example.com/path?name=John&age=30': { age: '30', name: 'John' },
    };

    Object.entries(urls).forEach(([url, params]) => {
      expect(urlSearchParams(url)).toEqual(params);
    });
  });
});

describe('addURLParam function', () => {
  test('should handle empty param or value', () => {
    expect(addURLParam('https://example.com', 'key', '')).toBe(
      'https://example.com'
    );
    expect(addURLParam('https://example.com', '', 'value')).toBe(
      'https://example.com'
    );
  });

  test('should handle multiple calls for chaining params', () => {
    const url = 'https://example.com';
    const withFirst = addURLParam(url, 'lng', 'en');
    expect(withFirst).toBe('https://example.com?lng=en');
    const withSecond = addURLParam(withFirst, 'fiatCur', 'USD');
    expect(withSecond).toBe('https://example.com?lng=en&fiatCur=USD');
  });
});
