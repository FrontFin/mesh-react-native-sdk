import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import {
  AccessTokenPayload,
  DEFAULT_BACKUP_WIDGET_ORIGIN,
  LinkConnect,
  LinkEventType,
  LinkPayload,
  MeshBackupConfig,
  MeshBackupJitStatusResult,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
} from '@meshconnect/react-native-link-sdk';
import Reports from './components/reports';
import {LARGE_DESTINATIONS} from './largeDemoDestinations';

const layout_width = Dimensions.get('window').width;

// The example follows the device appearance (Settings ▸ Display, or ⇧⌘A in the
// iOS Simulator). The SDK flows get the same via `theme: 'system'`.
const PALETTE = {
  light: {
    bg: '#ffffff',
    text: '#363636',
    muted: '#6b6b6b',
    border: '#363636',
    placeholder: '#9a9a9a',
    disabled: '#cfcfcf',
    primaryBg: '#000000',
    primaryText: '#ffffff',
  },
  dark: {
    bg: '#111318',
    text: '#f2f3f5',
    muted: '#a7adb8',
    border: '#4a4f5c',
    placeholder: '#7c8799',
    disabled: '#353a45',
    primaryBg: '#ffffff',
    primaryText: '#000000',
  },
};

// --- Backup / outage demo -------------------------------------------------
// The deposit-only backup flow runs when the primary Mesh API is unavailable.
// It needs no link token: it loads the standalone backup widget from its origin
// and takes a client-assembled MeshBackupConfig. By default this demo passes NO
// `widgetOrigin`, so the SDK uses its own built-in default
// (DEFAULT_BACKUP_WIDGET_ORIGIN = the production backup widget) — exactly what a
// client gets out of the box. Type an origin in the "Tier-1 widget origin" field
// to override it (e.g. a locally-run widget); leave it blank to use the default.

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
  clientId: '00000000-0000-4000-8000-000000000000', // placeholder client id
  userId: 'rn-example-user',
  destinations: [
    // Both logos bundled (baseline).
    {networkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611', symbol: 'USDC', address: EVM_DEMO_ADDRESS}, // USDC · Ethereum
    {networkId: 'c5dc5d2e-68c1-4261-9a30-90b598738bf5', symbol: 'USDC', address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'}, // USDC · Tron
    // Tier 2: token INITIALS (AAVE not in top-8), network logo shown.
    {networkId: 'e3c7fdd8-b1fc-4e51-85ae-bb276e075611', symbol: 'AAVE', address: EVM_DEMO_ADDRESS}, // AAVE · Ethereum
    // Tier 2: token logo shown, network INITIALS (Optimism / Avalanche not in top-8).
    {networkId: '18fa36b0-88a8-43ca-83db-9a874e0a2288', symbol: 'USDC', address: EVM_DEMO_ADDRESS}, // USDC · Optimism
    {networkId: 'bad16371-c22a-4bf4-a311-274d046cd760', symbol: 'USDT', address: EVM_DEMO_ADDRESS}, // USDT · Avalanche
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

// Built per open from the ACTIVE destination list (demo or large set), so the
// address returned for a pair is the one that config declares for it.
const makeDemoOnStatusPoll =
  (destinations: MeshBackupConfig['destinations']) =>
  async (
    symbol: string,
    networkId: string,
  ): Promise<MeshBackupJitStatusResult> => {
  const key = `${symbol}:${networkId}`;
  const n = (jitPollCounts.get(key) ?? 0) + 1;
  jitPollCounts.set(key, n);
  console.log('onStatusPoll', symbol, networkId, 'attempt', n);
  // Pretend the address takes ~2 polls to provision.
  if (n < 3) {
    return {status: 'pending'};
  }
  // Return the address the active config declared for THIS pair, so each
  // network gets a correctly-formatted address (e.g. the Tron address for
  // USDC·Tron, an EVM address for the EVM pairs) — not a one-size EVM address
  // that would fail the widget's per-network format check.
  const dest = destinations.find(
    d => d.symbol === symbol && d.networkId === networkId,
  );
  return {status: 'ready', address: dest?.address ?? EVM_DEMO_ADDRESS};
};

// The large-set variant: ~600 destinations (see largeDemoDestinations.ts) to
// exercise the widget at a realistic production config size.
const LARGE_BACKUP_CONFIG: MeshBackupConfig = {
  ...DEMO_BACKUP_CONFIG,
  destinations: LARGE_DESTINATIONS,
};

// The address-less variant used when "Force JIT" is on: same destinations,
// `address` stripped so each resolves via the callbacks.
const withoutAddresses = (config: MeshBackupConfig): MeshBackupConfig => ({
  ...config,
  destinations: config.destinations.map(({networkId, symbol}) => ({
    networkId,
    symbol,
  })),
});

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
  // Optional Tier-1 origin override. Blank (the default) means "pass no
  // widgetOrigin", so the SDK loads its own default (the production backup
  // widget). Type a value to point at another origin (e.g. a local widget);
  // ignored when Force Tier-2 is on (that path loads the SDK-bundled widget).
  const [tier1Origin, setTier1Origin] = useState('');
  const [backupTier, setBackupTier] = useState<'tier1' | 'tier2'>('tier1');
  // Demo toggle: when on, destinations drop their static address and resolve via
  // the onAddressInit/onStatusPoll callbacks (OR-452). Pair with Force Tier-2 to
  // run JIT end to end against the bundled callback-widget.
  const [forceJit, setForceJit] = useState(false);
  // Demo toggle: when on, pass a production-sized config (~600 destinations) instead of
  // the 6 hand-picked ones, to test the widget with a production-sized config.
  const [largeSet, setLargeSet] = useState(false);
  const connectButtonTitle = 'Connect account';
  const isDark = useColorScheme() === 'dark';
  const c = isDark ? PALETTE.dark : PALETTE.light;
  const statusBar = (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={c.bg}
    />
  );

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
    const customOrigin = tier1Origin.trim();
    // Prop passed to LinkConnect: omit it (undefined) when there is no override,
    // so the SDK falls back to DEFAULT_BACKUP_WIDGET_ORIGIN — the exact path a
    // production client takes. A typed value overrides it; Force Tier-2 points at
    // a dead origin so the Tier-1 load fails and the SDK cascades to Tier 2.
    const widgetOriginOverride = forceTier2
      ? DEAD_BACKUP_WIDGET_ORIGIN
      : customOrigin || undefined;
    // The origin actually in effect, for the on-screen banner: the override if
    // set, else the SDK's own default that LinkConnect will use.
    const activeOrigin =
      widgetOriginOverride ?? DEFAULT_BACKUP_WIDGET_ORIGIN;
    const baseConfig = largeSet ? LARGE_BACKUP_CONFIG : DEMO_BACKUP_CONFIG;
    return (
      <View style={[styles.flex, {backgroundColor: c.bg}]}>
        {statusBar}
        {/* Spec entry point: the same <LinkConnect>, given a backupConfig in
            place of a linkToken (backup client spec §3.1). */}
        <LinkConnect
          widgetOrigin={widgetOriginOverride}
          backupConfig={forceJit ? withoutAddresses(baseConfig) : baseConfig}
          onAddressInit={demoOnAddressInit}
          onStatusPoll={makeDemoOnStatusPoll(baseConfig.destinations)}
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
        style={[styles.container, {backgroundColor: c.bg}]}
        testID={'example-app-link-container'}>
        {statusBar}
        <ScrollView>
          <View style={styles.headerDivider} />
          <View
            testID={'example-app-link-token-container'}
            style={[styles.inputContainer, {borderColor: c.border}]}>
            <TextInput
              testID={'example-app-link-token-input'}
              value={linkToken}
              onChangeText={e => setLinkToken(e)}
              onSubmitEditing={() => {
                if (linkToken.trim()) {
                  setView(true);
                }
              }}
              style={[styles.exampleLinkTokenInput, {color: c.text}]}
              placeholder="Enter link token"
              placeholderTextColor={c.placeholder}
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
            style={[styles.conBtn, {backgroundColor: c.primaryBg}]}
            testID={'example-app-connect-btn'}>
            <Text style={[styles.connectButtonText, {color: c.primaryText}]}>
              {connectButtonTitle}
            </Text>
          </TouchableOpacity>

          <View
            testID={'example-app-backup-origin-container'}
            style={styles.originField}>
            <Text style={[styles.switchLabel, {color: c.text}]}>Tier-1 widget origin (optional)</Text>
            <TextInput
              testID={'example-app-backup-origin-input'}
              value={tier1Origin}
              onChangeText={setTier1Origin}
              editable={!forceTier2}
              autoCapitalize={'none'}
              autoCorrect={false}
              style={[
                styles.originInput,
                {borderColor: c.border, color: c.text},
                forceTier2 && {borderColor: c.disabled, color: c.placeholder},
              ]}
              placeholder={`${DEFAULT_BACKUP_WIDGET_ORIGIN} (SDK default)`}
              placeholderTextColor={c.placeholder}
            />
            <Text style={[styles.switchHint, {color: c.muted}]}>
              Leave blank to use the SDK's built-in production default. Type an
              origin to override it, e.g. a locally-run widget. Ignored when Force
              Tier-2 is on.
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
              <Text style={[styles.switchLabel, {color: c.text}]}>Force Tier-2 fallback</Text>
              <Text style={[styles.switchHint, {color: c.muted}]}>
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
              <Text style={[styles.switchLabel, {color: c.text}]}>Force JIT (address-less)</Text>
              <Text style={[styles.switchHint, {color: c.muted}]}>
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

          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Text style={[styles.switchLabel, {color: c.text}]}>
                Large destination set ({LARGE_DESTINATIONS.length})
              </Text>
              <Text style={[styles.switchHint, {color: c.muted}]}>
                Passes a production-sized set of pairs instead of the 6 demo
                destinations. Addresses are demo addresses — never send funds.
              </Text>
            </View>
            <Switch
              testID={'example-app-large-set-switch'}
              value={largeSet}
              onValueChange={setLargeSet}
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
  originField: {
    width: layout_width * 0.9,
    alignSelf: 'center',
    marginTop: 16,
  },
  originInput: {
    borderWidth: 1,
    borderColor: '#363636',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 6,
    fontSize: 14,
    color: '#363636',
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
