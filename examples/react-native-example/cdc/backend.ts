import {DEMO_BACKEND_URL, DEMO_USER_ID} from './demoConfig';

/**
 * Thin client for the mock client backend (examples/backup-mock-backend). In a
 * real integration this is the client's own server; here it stands in for it so
 * the demo shows the same call shapes CDC would make.
 */

export interface LinkTokenResult {
  configured: boolean;
  linkToken: string;
  message?: string;
}

/** Raised when the primary path fails in a way that means "Mesh is unavailable". */
export class MeshOutageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MeshOutageError';
  }
}

/**
 * Classify a failure as a Mesh outage — the signal to fall back to the backup
 * flow. Mirrors the web SDK's `isMeshOutage` (OR-450), which the RN SDK does not
 * (yet) ship: network error / timeout / 5xx / 429 are outages; other 4xx are not.
 */
export function isMeshOutage(status?: number): boolean {
  if (status === undefined) {
    return true; // fetch threw — network error / timeout
  }
  return status >= 500 || status === 429;
}

/**
 * Ask the backend to mint a Mesh link token (the normal deposit path). Passing
 * `simulateOutage` makes the backend return 503, which surfaces here as a
 * {@link MeshOutageError} so the caller can fall back to backup.
 */
export async function mintLinkToken(
  simulateOutage: boolean,
): Promise<LinkTokenResult> {
  let res: Response;
  try {
    res = await fetch(`${DEMO_BACKEND_URL}/linktoken`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId: DEMO_USER_ID, simulateOutage}),
    });
  } catch (err) {
    // Backend unreachable / network error — treat as an outage.
    throw new MeshOutageError(
      `Could not reach the client backend: ${(err as Error).message}`,
    );
  }

  if (!res.ok) {
    if (isMeshOutage(res.status)) {
      throw new MeshOutageError(`Primary API returned ${res.status}`);
    }
    throw new Error(`Link token request failed (${res.status})`);
  }

  const body = (await res.json()) as {
    configured?: boolean;
    content?: {linkToken?: string};
    message?: string;
  };
  return {
    configured: body.configured ?? false,
    linkToken: body.content?.linkToken ?? '',
    message: body.message,
  };
}

/**
 * Mint a short-lived, user-scoped bearer token for the backup JIT calls. Only
 * needed for the JIT backup variant; the static-address variant skips it.
 */
export async function mintBackupToken(): Promise<string> {
  const res = await fetch(`${DEMO_BACKEND_URL}/backup/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({userId: DEMO_USER_ID}),
  });
  if (!res.ok) {
    throw new Error(`Backup token request failed (${res.status})`);
  }
  const body = (await res.json()) as {token?: string};
  if (!body.token) {
    throw new Error('Backup token response had no token');
  }
  return body.token;
}
