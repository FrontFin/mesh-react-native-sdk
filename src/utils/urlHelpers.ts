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

export const addURLParam = (url: string, param: string, value: string) => {
  if (!param.length || !value.length) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${param}=${value}`;
};
