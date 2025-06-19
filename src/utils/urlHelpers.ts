import queryString from 'query-string';

export const urlSearchParams = (url?: string) => {
  if (!url) return {};

  const query = queryString.parseUrl(url).query;
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }

  return params;
};
