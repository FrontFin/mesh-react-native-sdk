/**
 * CDC-lookalike palette for the OR-453 backup demo. A restrained, Crypto.com-like
 * dark/navy theme so the demo reads as "the client's own app". It is a stylised
 * lookalike for an internal Mesh demo — no client logo assets are bundled.
 */
export const cdc = {
  bg: '#0b1120', // deep navy app background
  surface: '#141b2d', // cards / panels
  primary: '#0a4bd6', // CDC-ish action blue
  primaryText: '#ffffff',
  text: '#f5f7fb',
  textMuted: '#8b96ad',
  border: '#26314d',
  danger: '#ff5c5c',
  warning: '#f7a600',
} as const;
