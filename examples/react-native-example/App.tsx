import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AccessTokenPayload,
  LinkConnect,
  LinkConnectBackup,
  LinkEventType,
  LinkPayload,
  MeshBackupConfig,
  TransferFinishedPayload,
  TransferFinishedSuccessPayload,
} from '@meshconnect/react-native-link-sdk';
import Reports from './components/reports';
import {cdc} from './cdc/theme';
import {MeshOutageError, mintBackupToken, mintLinkToken} from './cdc/backend';
import {
  BACKUP_MODE,
  buildBackupConfig,
  DEMO_BACKUP_WIDGET_ORIGIN,
} from './cdc/demoConfig';

// --- CDC-lookalike backup demo (OR-453) -------------------------------------
// A Crypto.com-styled deposit screen wired to a mock client backend. It shows
// the two halves of the SDK backup story on one screen:
//
//   • Deposit (toggle OFF) -> the app mints a Mesh link token from its backend
//     and opens the normal LinkConnect flow.
//   • Deposit (toggle ON)  -> the backend fails the link-token call (503), the
//     app detects the outage and falls back to LinkConnectBackup, which loads
//     the standalone backup widget and completes a deposit with the primary
//     API dead.
//
// The same fallback fires automatically if the primary genuinely errors — the
// toggle just makes it reproducible on demand for a live demo.

type Screen = 'home' | 'connect' | 'backup';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [outageOn, setOutageOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkToken, setLinkToken] = useState('');
  const [backupConfig, setBackupConfig] = useState<MeshBackupConfig | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    AccessTokenPayload | TransferFinishedSuccessPayload | null
  >(null);

  function showIntegrationConnectedAlert(payload: AccessTokenPayload) {
    Alert.alert(
      `${payload.brokerName} connected!`,
      `accountId: ${payload.accountTokens[0].account.accountId}`,
      [{text: 'Ok', onPress: () => setData(payload)}],
    );
  }

  function showTransferFinishedAlert(payload: TransferFinishedSuccessPayload) {
    Alert.alert(
      'Transfer Finished',
      `Symbol: ${payload?.symbol}\n      Amount: ${payload?.amount}`,
      [{text: 'Ok', onPress: () => setData(payload)}],
    );
  }

  // Open the deposit-only backup widget. In JIT mode we first mint a short-lived
  // bearer for the widget's client-direct address calls; the static-address
  // variant needs none.
  async function startBackup() {
    setStatus('Primary API unavailable — switching to backup deposit…');
    try {
      const token = BACKUP_MODE === 'jit' ? await mintBackupToken() : undefined;
      setBackupConfig(buildBackupConfig(token));
      setScreen('backup');
    } catch (e) {
      setError(`Could not start backup flow: ${(e as Error).message}`);
      setStatus(null);
    }
  }

  async function handleDeposit() {
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const result = await mintLinkToken(outageOn);
      if (!result.configured || !result.linkToken) {
        setStatus(
          result.message ??
            'Normal deposit needs a Mesh link token — see the mock backend README. The backup flow still works.',
        );
        return;
      }
      setLinkToken(result.linkToken);
      setScreen('connect');
    } catch (e) {
      // A Mesh outage (simulated via the toggle, or a real 5xx/network failure)
      // is the cue to fall back to the backup deposit flow.
      if (e instanceof MeshOutageError) {
        await startBackup();
      } else {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  function returnHome() {
    setScreen('home');
    setLinkToken('');
    setStatus(null);
    setError(null);
  }

  if (screen === 'backup' && backupConfig) {
    return (
      <LinkConnectBackup
        widgetOrigin={DEMO_BACKUP_WIDGET_ORIGIN}
        backupConfig={backupConfig}
        settings={{language: 'en', theme: 'dark'}}
        onTransferFinished={(payload: TransferFinishedPayload) => {
          if (payload.status === 'success') {
            showTransferFinishedAlert(payload);
          } else {
            setError(payload.errorMessage);
          }
        }}
        onEvent={(event: LinkEventType) => {
          console.log('Backup event received:', event);
        }}
        onExit={(err?: string) => {
          console.log('Backup onExit called:', err);
          returnHome();
        }}
      />
    );
  }

  if (screen === 'connect' && linkToken.length) {
    return (
      <LinkConnect
        linkToken={linkToken}
        settings={{language: 'en', displayFiatCurrency: 'USD', theme: 'dark'}}
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
          returnHome();
        }}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      testID={'example-app-link-container'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header — CDC-lookalike wordmark + demo badge */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>C</Text>
            </View>
            <Text style={styles.brandText}>crypto demo</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MESH BACKUP DEMO</Text>
          </View>
        </View>

        {/* Fake portfolio card, for a realistic client-app look */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Portfolio balance</Text>
          <Text style={styles.balanceValue}>$12,480.55</Text>
          <Text style={styles.balanceSub}>USDC · demo account</Text>
        </View>

        <TouchableOpacity
          onPress={handleDeposit}
          disabled={busy}
          style={[styles.depositBtn, busy && styles.depositBtnDisabled]}
          testID={'example-app-connect-btn'}>
          {busy ? (
            <ActivityIndicator color={cdc.primaryText} />
          ) : (
            <Text style={styles.depositBtnText}>Deposit crypto</Text>
          )}
        </TouchableOpacity>

        {/* Outage toggle — the demo control */}
        <View style={styles.toggleRow} testID={'example-app-outage-toggle'}>
          <View style={styles.toggleLabelWrap}>
            <Text style={styles.toggleLabel}>Simulate Mesh outage</Text>
            <Text style={styles.toggleHint}>
              {outageOn
                ? 'Deposit will fail on the primary API and fall back to the backup flow.'
                : 'Deposit uses the normal Mesh flow.'}
            </Text>
          </View>
          <Switch
            value={outageOn}
            onValueChange={setOutageOn}
            trackColor={{false: cdc.border, true: cdc.warning}}
            thumbColor={cdc.text}
            testID={'example-app-outage-switch'}
          />
        </View>

        {status && (
          <Text testID={'example-app-status'} style={styles.statusText}>
            {status}
          </Text>
        )}

        {error && (
          <Text testID={'example-app-error'} style={styles.errorText}>
            Error: {error}
          </Text>
        )}

        {data && (
          <View
            style={styles.reportsContainer}
            testID={'example-app-reports-container'}>
            <Reports data={data} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cdc.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monogram: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: cdc.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  monogramText: {
    color: cdc.primaryText,
    fontSize: 20,
    fontWeight: '800',
  },
  brandText: {
    color: cdc.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badge: {
    borderColor: cdc.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: cdc.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: cdc.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cdc.border,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    color: cdc.textMuted,
    fontSize: 13,
  },
  balanceValue: {
    color: cdc.text,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
  },
  balanceSub: {
    color: cdc.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  depositBtn: {
    backgroundColor: cdc.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositBtnDisabled: {
    opacity: 0.6,
  },
  depositBtnText: {
    color: cdc.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cdc.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cdc.border,
    padding: 16,
    marginTop: 20,
  },
  toggleLabelWrap: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    color: cdc.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleHint: {
    color: cdc.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statusText: {
    color: cdc.warning,
    fontSize: 14,
    marginTop: 20,
    lineHeight: 20,
  },
  errorText: {
    color: cdc.danger,
    fontSize: 14,
    marginTop: 20,
  },
  reportsContainer: {
    marginTop: 28,
  },
});
