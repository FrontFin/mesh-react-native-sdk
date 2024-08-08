import { decode64 } from './base64';

interface LinkStyle {
  th?: string | 'dark' | 'system';
}

export const decodeLinkStyle = (encoded?: string | null): LinkStyle | undefined => {
  try {
    const decodedURiString = decode64(decodeURIComponent(encoded || ''));
    return encoded ? JSON.parse(decodedURiString) : undefined;
  } catch (e) {
    return undefined;
  }
}
