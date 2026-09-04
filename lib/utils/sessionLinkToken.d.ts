import type { MeshLinkEnvironment } from '../types';
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
export declare const sessionLinkToken: (token: string, environment: MeshLinkEnvironment) => string;
