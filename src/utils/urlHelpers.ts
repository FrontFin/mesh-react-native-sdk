import queryString from 'query-string';

export const urlSearchParams = (url?: string) => {
  if (!url) return {};

  const parsedUrl = queryString.parseUrl(url);
  return parsedUrl.query;
};
