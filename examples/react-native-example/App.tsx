import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AccessTokenPayload,
  LinkConnect,
  LinkEventType,
  LinkPayload,
  MeshBackupConfig,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
} from '@meshconnect/react-native-link-sdk';
import Reports from './components/reports';

const layout_width = Dimensions.get('window').width;

// --- Backup / outage demo -------------------------------------------------
// The deposit-only backup flow runs when the primary Mesh API is unavailable.
// It needs no link token: it loads the standalone backup widget from its origin
// and takes a client-assembled MeshBackupConfig. This defaults to the CI-deployed
// backup widget (the `link-backup` Cloudflare Worker); override it in the app via
// the "Tier-1 widget origin" field (e.g. to point at a locally-run widget).
const DEMO_BACKUP_WIDGET_ORIGIN =
  'https://link-backup.front-finance-account.workers.dev';

// A deliberately unreachable origin (reserved `.invalid` TLD, RFC 6761). When the
// "Force Tier-2 fallback" toggle is on, the backup flow is pointed here so the
// Tier-1 widget load fails immediately and the SDK cascades to the bundled Tier-2
// offline widget — the "second level" (no-Mesh-domain) fallback (OR-474). Flip
// the toggle off to instead point at a routable-but-silent host (e.g.
// 'http://10.255.255.1') to exercise the ready-handshake-timeout path instead.
const DEAD_BACKUP_WIDGET_ORIGIN = 'https://backup-widget.invalid';

// networkIds are real Mesh network ids (from the widget's live pairs manifest).
// Static addresses are used so no backend is required; flip the "Force JIT" toggle
// to instead resolve addresses through the onAddressInit/onStatusPoll callbacks below.
//
// The destinations deliberately span all four Tier-2 logo cases. Tier 1 loads
// the full manifest, so every logo renders. Tier 2 ships only the curated top-8
// tokens (USDC/USDT/ETH/BTC/SOL/XRP/BNB/DOGE) and top-8 networks (Ethereum/
// Bitcoin/Solana/Tron/Polygon/Base/Arbitrum/XRPL), so anything outside those
// falls back to the initials placeholder — visible drift, never a broken flow.
//
// NOTE: demo addresses for the QR/copy screen only — do not send real funds.
// EVM chains share the 0x address format, so one demo address is reused for all.
const EVM_DEMO_ADDRESS = '0x503828976D22510aad0201ac7EC88293211D23Da';
const DEMO_BACKUP_CONFIG: MeshBackupConfig = {
  clientId: '26C2621E-2C09-4CCC-DCF7-08DE90525AA1', // CDC (Crypto.com)
  userId: 'rn-example-user',
  destinations: [
    // Both logos bundled (baseline).
    {networkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611', symbol: 'USDC', address: EVM_DEMO_ADDRESS}, // USDC · Ethereum
    {networkId: 'c5dc5d2e-68c1-4261-9a30-90b598738bf5', symbol: 'USDC', address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'}, // USDC · Tron
    // Tier 2: token INITIALS (AAVE not in top-8), network logo shown.
    {networkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611', symbol: 'AAVE', address: EVM_DEMO_ADDRESS}, // AAVE · Ethereum
    // Tier 2: token logo shown, network INITIALS (Optimism / Linea not in top-8).
    {networkId: '18fa36b0-88a8-43ca-83db-9a874e0a2288', symbol: 'USDC', address: EVM_DEMO_ADDRESS}, // USDC · Optimism
    {networkId: '46e4920f-bbb6-4970-95d0-5be58c526a82', symbol: 'USDT', address: EVM_DEMO_ADDRESS}, // USDT · Linea
    // Tier 2: BOTH initials (DAI + Avalanche, neither bundled).
    {networkId: 'bad16371-c22a-4bf4-a311-274d046cd760', symbol: 'DAI', address: EVM_DEMO_ADDRESS}, // DAI · Avalanche
  ],
  // No preselectedSymbol: show the token-select screen so the bundled-vs-initials
  // token logos are visible (USDC/USDT have logos; AAVE/DAI render initials in Tier 2).
};

// --- JIT via SDK callbacks (OR-452) ---------------------------------------
// When "Force JIT" is on, the destinations drop their static `address` and the
// widget resolves each one through these callbacks — which run HERE in the host
// app (no token, no client endpoint in the widget). This mock stands in for a
// call to your own backend: it reports `pending` for the first couple of polls,
// then `ready` with a demo address, exercising the real poll loop. In a real
// integration these call your backend with your session; return the SAME address
// for a given (symbol, networkId) every time (idempotent).
const jitPollCounts = new Map<string, number>();

const demoOnAddressInit = (symbol: string, networkId: string) => {
  jitPollCounts.set(`${symbol}:${networkId}`, 0);
  console.log('onAddressInit', symbol, networkId);
};

const demoOnStatusPoll = async (
  symbol: string,
  networkId: string,
): Promise<{status: 'pending' | 'ready' | 'failed'; address?: string}> => {
  const key = `${symbol}:${networkId}`;
  const n = (jitPollCounts.get(key) ?? 0) + 1;
  jitPollCounts.set(key, n);
  console.log('onStatusPoll', symbol, networkId, 'attempt', n);
  // Pretend the address takes ~2 polls to provision.
  if (n < 3) {
    return {status: 'pending'};
  }
  return {status: 'ready', address: EVM_DEMO_ADDRESS};
};

// The address-less variant of the config used when "Force JIT" is on: same
// destinations, `address` stripped so each resolves via the callbacks.
const JIT_BACKUP_CONFIG: MeshBackupConfig = {
  ...DEMO_BACKUP_CONFIG,
  destinations: DEMO_BACKUP_CONFIG.destinations.map(({networkId, symbol}) => ({
    networkId,
    symbol,
  })),
};

export default function App() {
  const [data, setData] = useState<
    AccessTokenPayload | TransferFinishedSuccessPayload | null
  >(null);
  const [view, setView] = useState(false);
  const [backupView, setBackupView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string>('');
  // Demo toggle: when on, the backup flow is pointed at an unreachable origin so
  // it cascades to the bundled Tier-2 fallback (OR-474). `backupTier` is surfaced
  // from the SDK's `backupTierChanged` event so the active tier shows on screen.
  const [forceTier2, setForceTier2] = useState(false);
  // Where the Tier-1 backup widget loads from (defaults to the CI-deployed
  // widget). Editable in the UI to point at a local widget; ignored when Force
  // Tier-2 is on (that path loads the SDK-bundled widget, not a remote origin).
  const [tier1Origin, setTier1Origin] = useState(DEMO_BACKUP_WIDGET_ORIGIN);
  const [backupTier, setBackupTier] = useState<'tier1' | 'tier2'>('tier1');
  // Demo toggle: when on, destinations drop their static address and resolve via
  // the onAddressInit/onStatusPoll callbacks (OR-452). Pair with Force Tier-2 to
  // run JIT end to end against the bundled callback-widget.
  const [forceJit, setForceJit] = useState(false);
  const connectButtonTitle = 'Connect account';

  function showIntegrationConnectedAlert(payload: AccessTokenPayload) {
    Alert.alert(
      `${payload.brokerName} connected!`,
      `accountId: ${payload.accountTokens[0].account.accountId}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload);
          },
        },
      ],
    );
  }

  function showTransferFinishedAlert(payload: TransferFinishedSuccessPayload) {
    Alert.alert(
      'Transfer Finished',
      `Symbol: ${payload?.symbol}
      Amount: ${payload?.amount}`,
      [
        {
          text: 'Ok',
          onPress: () => {
            setData(payload);
          },
        },
      ],
    );
  }

  if (backupView) {
    const activeOrigin = forceTier2
      ? DEAD_BACKUP_WIDGET_ORIGIN
      : tier1Origin.trim() || DEMO_BACKUP_WIDGET_ORIGIN;
    return (
      <View style={styles.flex}>
        {/* Spec entry point: the same <LinkConnect>, given a backupConfig in
            place of a linkToken (CDC client spec §3.1). */}
        <LinkConnect
          widgetOrigin={activeOrigin}
          backupConfig={forceJit ? JIT_BACKUP_CONFIG : DEMO_BACKUP_CONFIG}
          onAddressInit={demoOnAddressInit}
          onStatusPoll={demoOnStatusPoll}
          settings={{language: 'en', theme: 'system'}}
          onTransferFinished={(payload: TransferFinishedPayload) => {
            if (payload.status === 'success') {
              showTransferFinishedAlert(payload);
            } else {
              setError(payload.errorMessage);
            }
          }}
          onEvent={(event: LinkEventType) => {
            console.log('Backup event received:', event);
            // Surface the Tier-1 → Tier-2 cascade so the demo shows which tier
            // actually rendered the deposit (OR-474).
            if (event.type === 'backupTierChanged') {
              setBackupTier(event.payload.to);
            }
          }}
          onExit={(err?: string) => {
            console.log('Backup onExit called:', err);
            setBackupView(false);
          }}
        />
        <View pointerEvents="none" style={styles.tierBanner}>
          <Text style={styles.tierBannerText}>
            {backupTier === 'tier2'
              ? '● Tier 2 · bundled offline widget (no Mesh network)'
              : `○ Tier 1 · ${activeOrigin.replace(/^https?:\/\//, '')}`}
          </Text>
        </View>
      </View>
    );
  }

  if (view && linkToken?.length) {
    return (
      <LinkConnect
        linkToken={linkToken}
        settings={{
          language: 'en',
          displayFiatCurrency: 'USD',
          theme: 'system',
        }}
        onIntegrationConnected={(payload: LinkPayload) => {
          if (payload.accessToken) {
            showIntegrationConnectedAlert(payload.accessToken);
          }
        }}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          if (payload.status === 'success') {
            showTransferFinishedAlert(payload);
          } else {
            setError(payload.errorMessage);
          }
        }}
        onEvent={(event: LinkEventType) => {
          console.log('Event received:', event);
        }}
        onExit={(err?: string) => {
          console.log('onExit called:', err);
          setView(false);
          setLinkToken('');
        }}
      />
    );
  }

  if (!view) {
    return (
      <SafeAreaView
        style={styles.container}
        testID={'example-app-link-container'}>
        <ScrollView>
          <View style={styles.headerDivider} />
          <View
            testID={'example-app-link-token-container'}
            style={styles.inputContainer}>
            <TextInput
              testID={'example-app-link-token-input'}
              value={linkToken}
              onChangeText={e => setLinkToken(e)}
              onSubmitEditing={() => {
                if (linkToken.trim()) {
                  setView(true);
                }
              }}
              style={styles.exampleLinkTokenInput}
              placeholder="Enter link token"
              placeholderTextColor={'#363636'}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              // The normal flow needs a real Mesh link token; without one
              // LinkConnect has nothing to load (previously a blank screen).
              if (!linkToken.trim()) {
                Alert.alert(
                  'Link token required',
                  'Paste a Mesh link token above to start the normal Connect flow. The backup deposit flow below needs no token.',
                );
                return;
              }
              setView(true);
            }}
            style={styles.conBtn}
            testID={'example-app-connect-btn'}>
            <Text style={styles.connectButtonText}>{connectButtonTitle}</Text>
          </TouchableOpacity>

          <View
            testID={'example-app-backup-origin-container'}
            style={styles.inputContainer}>
            <Text style={styles.switchLabel}>Tier-1 widget origin</Text>
            <TextInput
              testID={'example-app-backup-origin-input'}
              value={tier1Origin}
              onChangeText={setTier1Origin}
              editable={!forceTier2}
              autoCapitalize={'none'}
              autoCorrect={false}
              style={styles.exampleLinkTokenInput}
              placeholder={DEMO_BACKUP_WIDGET_ORIGIN}
              placeholderTextColor={'#363636'}
            />
            <Text style={styles.switchHint}>
              Where the backup widget loads from (ignored when Force Tier-2 is on).
              Point at a locally-run widget to test without the hosted deploy.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              // Reset to Tier 1 each open; the cascade (if any) updates it.
              setBackupTier('tier1');
              setBackupView(true);
            }}
            style={styles.backupBtn}
            testID={'example-app-backup-btn'}>
            <Text style={styles.connectButtonText}>
              Simulate outage — Backup deposit
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Text style={styles.switchLabel}>Force Tier-2 fallback</Text>
              <Text style={styles.switchHint}>
                Points the backup widget at an unreachable origin so it cascades
                to the bundled offline widget.
              </Text>
            </View>
            <Switch
              testID={'example-app-force-tier2-switch'}
              value={forceTier2}
              onValueChange={setForceTier2}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Text style={styles.switchLabel}>Force JIT (address-less)</Text>
              <Text style={styles.switchHint}>
                Drops static addresses so each destination resolves via the
                onAddressInit / onStatusPoll callbacks. Pair with Force Tier-2 to
                run it against the bundled callback-widget.
              </Text>
            </View>
            <Switch
              testID={'example-app-force-jit-switch'}
              value={forceJit}
              onValueChange={setForceJit}
            />
          </View>

          {data && (
            <View
              style={styles.reportsContainer}
              testID={'example-app-reports-container'}>
              <Reports data={data} />
            </View>
          )}

          {error && (
            <Text testID={'example-app-error'} style={styles.textError}>
              Error: {error}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: layout_width * 0.9,
    alignSelf: 'center',
    marginTop: 16,
  },
  switchLabelWrap: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: '#363636',
    fontWeight: '600',
  },
  switchHint: {
    fontSize: 12,
    color: '#6b6b6b',
    marginTop: 2,
  },
  tierBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tierBannerText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'center',
  },
  headerDivider: {
    height: 80,
    width: layout_width,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  inputContainer: {
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#363636',
    height: 45,
    borderRadius: 30,
    marginTop: 4,
  },
  conBtn: {
    backgroundColor: 'black',
    height: 50,
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  exampleLinkTokenInput: {
    width: '95%',
    height: 40,
    left: 10,
    color: '#363636',
  },
  backupBtn: {
    backgroundColor: '#6b21a8',
    height: 50,
    width: layout_width * 0.9,
    alignSelf: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  connectButtonText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
  },
  textError: {
    color: 'red',
  },
  reportsContainer: {
    marginTop: 30,
  },
});
