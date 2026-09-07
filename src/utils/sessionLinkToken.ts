import { LINK_URLS } from '../constant';
import type { MeshLinkEnvironment } from '../types';
import { encode64 } from './base64';

/**
 * Build a link token from an MFS session token.
 *
 * `POST /v2/sessions` returns a bare session token (`ory_ac_...`) rather than a
 * link token, and a bare token carries no host for the WebView to load. This
 * wraps it into the same base64-of-a-URL shape `LinkConnect` already takes, so
 * MFS-native and legacy converge on one code path:
 *
 * ```tsx
 * <LinkConnect linkToken={sessionLinkToken(token, 'prod')} … />
 * ```
 *
 * `environment` is required, not defaulted: a session token belongs to exactly
 * one environment, and quietly assuming production would send a dev token to
 * the wrong Link and fail in a way that is hard to read.
 */
export const sessionLinkToken = (
  token: string,
  environment: MeshLinkEnvironment
): string => {
  if (!token) {
    throw new Error('sessionLinkToken requires a session token');
  }

  const base = LINK_URLS[environment];
  if (!base) {
    throw new Error(`Unknown Mesh Link environment: ${environment}`);
  }

  // Encoded, not interpolated raw: a token carrying a reserved character
  // (`&`, `#`, `%`) would otherwise truncate the URL at it.
  return encode64(`${base}/?token=${encodeURIComponent(token)}`);
};
