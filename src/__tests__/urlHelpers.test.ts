import { urlSearchParams } from '../utils';

describe('urlSearchParams function', () => {
  test('should parse query parameters for URLs', () => {
    const urls: Record<string, Record<string, string>> = {
      'https://example.com' : {},
      'https://example.com?foo=bar&baz=qux' : { baz : 'qux', foo: 'bar' },
      'https://example.com?foo=bar#anchor' : { foo: 'bar' },
      'https://example.com?search=query&sort' : { search: 'query' },
      'https://example.com?test%20encoded=value' : { 'test encoded': 'value' },
      'https://example.com/path?name=John&age=30' : { age: '30', name: 'John' },
    }

    Object.entries(urls).forEach(([url, params]) => {
      expect(urlSearchParams(url)).toEqual(params);
    });
  });
});
