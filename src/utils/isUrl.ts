const WHITE_LISTED_DOMAINS = [
  'https://web.getfront.com/b2b-iframe/',
  'https://web.getfront.com/broker-connect',
  'https://web.getfront.com:443/b2b-iframe',
  'https://web.getfront.com:443/broker-connect',
  'https://www.meshconnect.com/',
  'https://meshconnect.com',
]

export const isValidUrl = (urlStr: string | null) => {
  if (typeof urlStr !== 'string' || !urlStr.length) {
    return false;
  }

  return WHITE_LISTED_DOMAINS.some((domain) => urlStr.startsWith(domain));
};
