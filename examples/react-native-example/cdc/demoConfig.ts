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

// Token/network pairs offered in the backup flow.
//
// symbols + networkIds come from the live CDC pairs manifest that the deployed
// widget actually fetches at runtime — the per-client file
// https://pairs.cascadecode.com/backup/pairs/<clientId>.json (125 pairs). Every
// pair below is in that manifest, so the widget shows the real network name and
// token logo. The widget derives the token list purely from these destinations.
//
// Addresses are format-valid per family (the widget validates the address
// string, never cross-checking it against the network) and are demo-only —
// do NOT send real funds to them.
const NET = {
  ethereum: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611',
  arbitrum: 'a34f2431-0ddd-4de4-bc22-4a8143287aeb',
  solana: '0291810a-5947-424d-9a59-e88bb33e999d',
  tron: 'c5dc5d2e-68c1-4261-9a30-90b598738bf5',
  bitcoin: '03dee5da-7398-428f-9ec2-ab41bcb271da',
  xrpl: '0ea47ee7-9d36-460e-a2d5-64cfa8a1dddd',
};
const ADDR = {
  evm: '0x503828976D22510aad0201ac7EC88293211D23Da',
  solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  tron: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
  bitcoin: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  xrp: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
};

type DemoPair = {
  networkId: string;
  symbol: string;
  address: string;
  addressTag?: string;
};

const PAIRS: DemoPair[] = [
  // USDC — multi-network (Ethereum + Solana), so token-select → network-select.
  {networkId: NET.ethereum, symbol: 'USDC', address: ADDR.evm},
  {networkId: NET.solana, symbol: 'USDC', address: ADDR.solana},
  // USDT — multi-network (Ethereum + Tron).
  {networkId: NET.ethereum, symbol: 'USDT', address: ADDR.evm},
  {networkId: NET.tron, symbol: 'USDT', address: ADDR.tron},
  // Single-network EVM tokens on Ethereum.
  {networkId: NET.ethereum, symbol: 'ETH', address: ADDR.evm},
  {networkId: NET.ethereum, symbol: 'DAI', address: ADDR.evm},
  {networkId: NET.ethereum, symbol: 'LINK', address: ADDR.evm},
  {networkId: NET.ethereum, symbol: 'UNI', address: ADDR.evm},
  {networkId: NET.ethereum, symbol: 'AAVE', address: ADDR.evm},
  // Other networks.
  {networkId: NET.arbitrum, symbol: 'ARB', address: ADDR.evm},
  {networkId: NET.solana, symbol: 'SOL', address: ADDR.solana},
  {networkId: NET.tron, symbol: 'TRX', address: ADDR.tron},
  {networkId: NET.bitcoin, symbol: 'BTC', address: ADDR.bitcoin},
  // XRP is a memo/tag chain — carry a destination tag to show that UI.
  {networkId: NET.xrpl, symbol: 'XRP', address: ADDR.xrp, addressTag: '2463470'},
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
      // preselectedSymbol intentionally omitted so the token-select screen shows.
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
    // preselectedSymbol intentionally omitted so the token-select screen shows.
  };
}
