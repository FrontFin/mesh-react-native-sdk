# Mesh Connect React Native SDK — CLAUDE.md

## Project Overview

This is the **Mesh Connect React Native SDK** (`@meshconnect/react-native-link-sdk`), a library that enables React Native apps to integrate with the Mesh Connect platform via a WebView-based UI flow. Users authenticate with brokerages/crypto wallets and the SDK returns tokens and transfer results to the host app.

- **Current version:** see `version` in `package.json`
- **npm package:** `@meshconnect/react-native-link-sdk`
- **GitHub:** https://github.com/FrontFin/mesh-react-native-sdk
- **License:** MIT

---

## Project Structure

```
mesh-react-native-sdk/
├── src/
│   ├── types/
│   │   └── index.ts            # All public types and interfaces (LinkConfiguration, LinkPayload, etc.)
│   ├── components/
│   │   ├── LinkConnect.tsx     # Main public component — entry point for host apps
│   │   ├── SDKContainer.tsx    # WebView host, URL loading, message handling
│   │   ├── SDKViewContainer.tsx
│   │   ├── NavBar.tsx
│   │   └── SDKContainer.styled.ts
│   ├── hooks/
│   │   └── useSDKCallbacks.ts  # Event dispatch and callback logic
│   ├── utils/
│   │   ├── base64.ts           # Base64 encode/decode utilities
│   │   ├── isUrl.ts            # URL detection
│   │   ├── sdkConfig.ts        # URL builder from LinkConfiguration
│   │   ├── styleHelpers.ts     # Style utilities
│   │   ├── theme.ts            # Theme resolution (light/dark/system)
│   │   └── urlHelpers.ts       # URL manipulation helpers
│   ├── __tests__/              # Unit tests
│   ├── index.ts                # Public exports (re-exports types + LinkConnect)
│   └── constant.ts             # SDK constants
├── examples/                   # Example React Native app
├── scripts/
│   ├── build.js                # Copies package.json, assets, LICENSE into dist/
│   ├── pre-commit.js           # Pre-commit hook
│   └── verify-build.js         # Validates dist/ output
├── dist/                       # Build output (published to npm)
├── .github/
│   ├── workflows/
│   │   ├── primary.yml         # CI: type-check + lint + test + build on PRs to main
│   │   └── release.yaml        # CD: publish, tag, GitHub Release, Slack announcement
│   └── actions/
│       └── version-details/    # Composite action (legacy, kept for reference)
├── .claude/
│   └── commands/               # Claude slash commands (bump-version)
├── package.json                # Version lives here — bump `version` field to release
├── RELEASE.md                  # Release process documentation
└── tsconfig.json               # TypeScript configuration
```

---

## Build & Development

### Common Commands

```bash
# Install dependencies
yarn install

# Type check
yarn types:check

# Lint
yarn lint

# Run tests
yarn test

# Build (outputs to dist/)
yarn build

# Validate build output
yarn check:build

# Full CI check (matches primary.yml)
yarn types:check && yarn lint && yarn test && yarn build && yarn check:build

# Publish to npm (run from repo root — builds then publishes from dist/)
yarn publish:npm
```

### Build Output

`yarn build` compiles TypeScript to `dist/src/`, then `scripts/build.js` post-processes it:
- Copies `package.json` (stripped of dev-only fields) to `dist/package.json`
- Moves compiled files from `dist/src/` → `dist/lib/`
- Copies `LICENSE.md`, `README.md`, `tsconfig.json`, assets, `.npmignore`, `.npmrc`

Publishing runs `yarn publish` from inside `dist/`, so the published package is `dist/`.

---

## Public API

### Entry Point

```tsx
import { LinkConnect } from '@meshconnect/react-native-link-sdk';

<LinkConnect
  linkToken="your-link-token"
  onIntegrationConnected={(payload) => { /* payload: LinkPayload */ }}
  onTransferFinished={(payload) => { /* payload: TransferFinishedPayload */ }}
  onEvent={(event) => { /* event: LinkEventType */ }}
  onExit={(err?) => { /* optional error string */ }}
/>
```

### `LinkConfiguration` (`src/types/index.ts`)

| Field | Type | Required | Description |
|---|---|---|---|
| `linkToken` | `string` | yes | Link token from Mesh backend |
| `settings` | `LinkSettings?` | no | Optional SDK settings |
| `renderViewContainer` | `boolean?` | no | Render `View` instead of `SafeAreaView` |
| `disableDomainWhiteList` | `boolean?` | no | Bypass domain whitelisting |
| `onIntegrationConnected` | `(payload: LinkPayload) => void` | no | Called on successful integration |
| `onTransferFinished` | `(payload: TransferFinishedPayload) => void` | no | Called when transfer completes |
| `onEvent` | `(event: LinkEventType) => void` | no | Called for all SDK events |
| `onExit` | `(err?: string) => void` | no | Called when user exits |

### `LinkSettings`

| Field | Type | Description |
|---|---|---|
| `accessTokens` | `IntegrationAccessToken[]?` | Pre-populate existing tokens |
| `language` | `string?` | BCP-47 language tag; pass `'system'` to use device locale |
| `displayFiatCurrency` | `string?` | ISO 4217 code for fiat display (e.g. `'USD'`) |
| `theme` | `LinkTheme?` | UI theme — `'light'`, `'dark'`, or `'system'` |

### `LinkTheme`

```ts
type LinkTheme = 'light' | 'dark' | 'system';
```

### `LinkPayload`

```ts
interface LinkPayload {
  accessToken?: AccessTokenPayload;
  delayedAuth?: DelayedAuthPayload;
}
```

### `TransferFinishedPayload`

Union of `TransferFinishedSuccessPayload | TransferFinishedErrorPayload`.

---

## Testing

Tests live in `src/__tests__/`.

### Running Tests

```bash
yarn test                    # all unit tests
yarn test --coverage         # with coverage report
```

### Key Test Files

| Test File | Covers |
|---|---|
| `LinkConnect.test.tsx` | Main component rendering and callbacks |
| `SDKContainer.test.tsx` | WebView host and message handling |
| `SDKViewContainer.test.tsx` | View container variants |
| `NavBar.test.tsx` | Navigation bar component |
| `base64.test.ts` | Base64 encode/decode utilities |
| `isUrl.test.ts` | URL detection logic |
| `sdkConfig.test.ts` | URL builder from LinkConfiguration |
| `theme.test.ts` | Theme resolution (light/dark/system) |

---

## Code Quality

- **TypeScript** — strict type-checking via `yarn types:check`
- **ESLint** — run `yarn lint` (config: `@react-native/eslint-config`)
- **Prettier** — auto-formatting (config in `package.json`)
- **Pre-commit hook** — runs `scripts/pre-commit.js` via husky

---

## Release Process

See `RELEASE.md` for full details. Summary:

1. Run `/bump-version` — automatically diffs HEAD against the latest tag, bumps `version` in `package.json` using semantic versioning, and prepends a new entry to `CHANGELOG.md`
2. Merge to `main`
3. The release workflow starts automatically on merge to `main`. Optionally trigger it manually
4. Verify the new version appears on npm

### Publishing Secrets (GitHub)
- `NPM_TOKEN` — npm publish token
- `SLACK_WEBHOOK_URL` — Slack incoming webhook for release announcements
- `SONAR_TOKEN` — SonarQube analysis token

---

## CI/CD Workflows

### `primary.yml` — runs on PRs to `main`
1. Type check (`yarn types:check`)
2. Lint (`yarn lint`)
3. Unit tests (`yarn test`)
4. SonarQube analysis
5. Build (`yarn build`)
6. Build validation (`yarn check:build`)
7. Unused dependency check
8. License check
9. Circular dependency check

### `release.yaml` — push to `main` or manual trigger
- Detects new version (compares `version` in `package.json` to latest tag) — skips if already released
- Validates CHANGELOG has a matching entry
- Runs CI checks (type-check, lint, tests, build, SonarQube)
- Publishes to npm
- Creates and pushes git tag `X.Y.Z` (matching the version from `package.json`, without a `v` prefix)
- Creates GitHub Release with changelog notes and full-diff link
- Posts Slack announcement

---

## Claude Slash Commands

Commands live in `.claude/commands/` and are invoked from within Claude Code with `/command-name`.

| Command | What it does |
|---|---|
| `/bump-version` | Diffs HEAD vs latest tag, classifies changes as MAJOR/MINOR/PATCH, bumps `version` in `package.json`, and prepends a new entry to `CHANGELOG.md` |

Typical release flow:
1. `/bump-version` — sets the version and writes the changelog
2. Merge the version bump PR to `main`
3. Release workflow auto-triggers and publishes to npm

---

## Development Tips

- **Version location:** The SDK version lives in `package.json` → `version`. The build script copies it to `dist/package.json` automatically.
- **Public API surface:** Everything exported from `src/index.ts` is public. The index re-exports all of `src/types/` and `src/components/LinkConnect`.
- **Adding a new event type:**
  1. Add the type key string to `LINK_EVENT_TYPE_KEYS` in `src/types/index.ts`
  2. Define the new interface extending `LinkEventBase` (or standalone if no payload)
  3. Add it to the `LinkEventType` union
  4. Add tests in `src/__tests__/`
- **Adding a new `LinkSettings` field:** Add the optional field to `LinkSettings` in `src/types/index.ts`, update `sdkConfig.ts` to pass it as a URL query parameter, and add tests.
- **Theme values:** Use `'light'`, `'dark'`, or `'system'` — the `theme.ts` utility resolves `'system'` to the device's current color scheme.
- **URL query parameters added by SDK:** `lng` (language), `fiatCur` (display fiat currency), `theme` (UI theme) — see `src/utils/sdkConfig.ts`.
- **Domain whitelist:** When `disableDomainWhiteList` is `false` (default), only Mesh-approved domains load in the WebView. Set it to `true` for testing with custom environments.
