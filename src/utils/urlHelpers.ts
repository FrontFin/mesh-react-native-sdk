const decodeQueryComponent = (value: string) => {
  const withSpaces = value.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    return withSpaces;
  }
};

// Hand-rolled instead of URLSearchParams, which older React Native versions don't fully implement.
// Mirrors query-string: keys without a value or that appear more than once are skipped.
export const urlSearchParams = (url?: string) => {
  if (!url) return {};

  const withoutHash = url.split('#')[0] ?? '';
  const queryStart = withoutHash.indexOf('?');
  if (queryStart === -1) return {};

  const query = withoutHash
    .slice(queryStart + 1)
    .trim()
    .replace(/^\?/, '');

  const occurrences = new Map<string, (string | null)[]>();
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const separator = pair.indexOf('=');
    const key = decodeQueryComponent(
      separator === -1 ? pair : pair.slice(0, separator)
    );
    const value =
      separator === -1 ? null : decodeQueryComponent(pair.slice(separator + 1));
    occurrences.set(key, [...(occurrences.get(key) ?? []), value]);
  }

  const params: Record<string, string> = Object.create(null);
  occurrences.forEach((values, key) => {
    const [value] = values;
    if (values.length === 1 && value !== null && value !== undefined) {
      params[key] = value;
    }
  });

  return params;
};

export const addURLParam = (url: string, param: string, value: string) => {
  if (!param.length) {
    return url;
  }
  if (!value.length) {
    return `${url}${url.includes('?') ? '&' : '?'}${param}`;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${param}=${value}`;
};
