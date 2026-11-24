import { decode64 } from './base64';

/**
 * The JSON object inside a base64 or base64url URL param (`link_style`, the session `token`),
 * or undefined when the value is not one. Reading a param from a URL turns its '+' into a
 * space, base64url uses '-' and '_', and the padding may be stripped, so all three are undone.
 */
export const decodeJsonParam = (
  encoded?: string
): Record<string, unknown> | undefined => {
  if (!encoded) return undefined;
  const base64 = encoded
    .replace(/ /g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const json: unknown = JSON.parse(decode64(padded));
    return json !== null && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};
