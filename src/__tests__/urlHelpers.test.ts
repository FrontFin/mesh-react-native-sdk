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
      'https://example.com?a=1+2&b=x=y': { a: '1 2', b: 'x=y' },
      'https://example.com?a=1&a=2&b=3': { b: '3' },
      'https://example.com?a&a=1': {},
      'https://example.com??a=1': { a: '1' },
      'https://example.com#hash?a=1': {},
      'https://example.com?bad=%E0%A4%A': { bad: '%E0%A4%A' },
      'https://example.com?constructor=1': { constructor: '1' },
    };

    Object.entries(urls).forEach(([url, params]) => {
      expect(urlSearchParams(url)).toEqual(params);
    });
  });
});

describe('addURLParam function', () => {
  test('should handle empty param', () => {
    expect(addURLParam('https://example.com', '', 'value')).toBe(
      'https://example.com'
    );
  });

  test('should handle empty value', () => {
    expect(addURLParam('https://example.com', 'key', '')).toBe(
      'https://example.com?key'
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
