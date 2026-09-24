import {MeshBackupConfig} from '@meshconnect/react-native-link-sdk';

/**
 * CDC-lookalike backup demo configuration (OR-453).
 *
 * Everything a presenter needs to tweak lives here. The demo has two halves:
 *  - NORMAL deposit  — the app asks the mock client backend for a Mesh link token.
 *  - BACKUP deposit  — used when the primary Mesh API is down; needs no link token.
 */

// --- The standalone backup widget (OR-449) ----------------------------------
// The deposit-only widget served from Mesh's independent backup origin. This is
// the live demo deployment; in production it is DEFAULT_BACKUP_WIDGET_ORIGIN.
export const DEMO_BACKUP_WIDGET_ORIGIN = 'https://demo-widget.cascadecode.com';

// --- The mock client backend (examples/backup-mock-backend) ------------------
// URL the APP uses to reach the backend (link token + backup-token minting).
//   • iOS simulator:      http://localhost:4600
//   • Android emulator:   http://10.0.2.2:4600   (localhost is the emulator itself)
//   • real device:        http://<your-LAN-ip>:4600
export const DEMO_BACKEND_URL = 'http://localhost:4600';

// URL the WIDGET uses to reach the backend's JIT endpoints. The widget runs on a
// remote origin, so for the JIT variant this must be PUBLIC (e.g. a cloudflared
// tunnel to the mock). Only used when BACKUP_MODE === 'jit'. Defaults to the same
// value; override with your tunnel URL to demo JIT.
export const PUBLIC_BACKEND_URL = DEMO_BACKEND_URL;

// 'jit'    — address-less destinations resolved via the client-direct JIT calls
//            (exercises the mock backend; needs PUBLIC_BACKEND_URL reachable by the widget).
// 'static' — fixed demo addresses; no backend JIT, no tunnel needed. Simplest live demo.
export const BACKUP_MODE: 'jit' | 'static' = 'static';

export const CDC_CLIENT_ID = '26C2621E-2C09-4CCC-DCF7-08DE90525AA1'; // CDC (Crypto.com)
export const DEMO_USER_ID = 'rn-example-user';

// Token/network pairs offered in the backup flow. networkIds match the live demo
// pairs manifest (https://demo-widget.cascadecode.com/backup/pairs/all.json) and
// the mock backend's demo-address map.
const PAIRS = [
  {
    networkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611', // USDC · Ethereum
    symbol: 'USDC',
    address: '0x503828976D22510aad0201ac7EC88293211D23Da',
  },
  {
    networkId: 'c5dc5d2e-68c1-4261-9a30-90b598738bf5', // USDC · Tron
    symbol: 'USDC',
    address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
  },
];

/**
 * Build the MeshBackupConfig for the current BACKUP_MODE. In `jit` mode the
 * destinations omit `address` and a top-level `jit` block (initiate/status URLs
 * + short-lived bearer) tells the widget to resolve each address itself. Assemble
 * this server-side in production — here the example plays the role of the client
 * server for demo purposes only.
 *
 * NOTE: static addresses are for showing the QR/copy screen only — do not send
 * real funds to them.
 */
export function buildBackupConfig(backupToken?: string): MeshBackupConfig {
  if (BACKUP_MODE === 'jit') {
    return {
      clientId: CDC_CLIENT_ID,
      userId: DEMO_USER_ID,
      destinations: PAIRS.map(({networkId, symbol}) => ({networkId, symbol})),
      preselectedSymbol: 'USDC',
      jit: {
        initiateUrl: `${PUBLIC_BACKEND_URL}/backup/jit/initiate`,
        statusUrl: `${PUBLIC_BACKEND_URL}/backup/jit/status`,
        token: backupToken ?? '',
      },
    };
  }

  return {
    clientId: CDC_CLIENT_ID,
    userId: DEMO_USER_ID,
    destinations: PAIRS,
    preselectedSymbol: 'USDC',
  };
}
