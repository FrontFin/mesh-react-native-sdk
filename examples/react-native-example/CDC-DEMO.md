# CDC-lookalike backup demo — scripted walkthrough (OR-453)

A live demo of the SDK **backup / redundancy** flow, styled to look like a client
app (Crypto.com / "CDC"). It shows one deposit screen that:

1. does a **normal** deposit through the primary Mesh API, and
2. when the primary API is **down**, falls back to the **backup deposit widget**
   and completes a deposit anyway.

The primary outage is simulated on demand with an in-app toggle, backed by the
mock client backend in [`../backup-mock-backend`](../backup-mock-backend).

> This is the **RN-first** demo (the priority path). The Web mirror
> (`examples/react-example` + `createLink`) follows once the web SDK ships
> `openLinkBackup` (OR-450).

---

## What talks to what

```
 ┌─────────────────────────┐   POST /linktoken            ┌──────────────────────┐
 │  RN example app (CDC)    │ ───────────────────────────▶ │  mock client backend │
 │                          │   POST /backup/token         │  (backup-mock-backend)│
 │  LinkConnect (normal)    │ ◀─────────────────────────── │                      │
 │  LinkConnectBackup ──────┼── loads widget ──▶ demo-widget.cascadecode.com       │
 └─────────────────────────┘                    │          └──────────┬───────────┘
                                                 │  POST /backup/jit/initiate
                                                 └──────────────────▶  │  (JIT variant only,
                                                    GET /backup/jit/status   Bearer token)
```

- **Normal path:** app → backend `/linktoken` → Mesh link token → `LinkConnect`.
- **Backup path:** app → backend `/backup/token` → assemble `MeshBackupConfig` →
  `LinkConnectBackup` loads the widget → (JIT variant) the **widget** calls the
  backend's `/backup/jit/*` directly with the short-lived bearer.

---

## Prerequisites

- Node 18+, Python 3, an iOS simulator or Android emulator.
- (JIT variant only) a tunnel tool, e.g. `cloudflared`.

## Setup

### 1. Build the SDK (from the repo root)

```sh
yarn && yarn build
```

### 2. Start the mock client backend

```sh
cd examples/backup-mock-backend
python3 mock_client_backend.py            # listens on 0.0.0.0:4600
```

For the **normal** deposit to load the real Mesh widget, give the backend a way to
mint a link token (otherwise the normal path shows a "not configured" hint and only
the backup path runs — which is still a complete demo):

```sh
# Option A — paste a token you already minted (zero-config, always works):
DEMO_LINK_TOKEN=<base64-link-token> python3 mock_client_backend.py

# Option B — proxy tokens from Mesh:
MESH_API_BASE=https://sandbox-integration-api.meshconnect.com \
MESH_CLIENT_ID=<client-id> MESH_CLIENT_SECRET=<client-secret> \
python3 mock_client_backend.py
```

> Option B forwards the app's link-token request body verbatim, and the example
> sends only a minimal one — extend `mintLinkToken` in
> [`cdc/backend.ts`](cdc/backend.ts) to a full request that matches your Mesh
> integration, or Mesh will 4xx and the app falls back to backup. Option A avoids
> that. The client secret is exposed to this process only; treat any secret you
> paste as exposed and rotate it afterwards.

### 3. Point the app at the backend

Edit [`cdc/demoConfig.ts`](cdc/demoConfig.ts):

- `DEMO_BACKEND_URL` — how the **app** reaches the backend:
  - iOS simulator → `http://localhost:4600`
  - Android emulator → `http://10.0.2.2:4600`
  - real device → `http://<your-LAN-ip>:4600`
- `BACKUP_MODE` — `'static'` (default, no tunnel) or `'jit'` (see below).

### 4. Run the app

```sh
cd examples/react-native-example
yarn
yarn ios        # or: yarn android
```

---

## The live script

1. **Show the client app.** The home screen is the CDC-styled deposit screen —
   balance card, **Deposit crypto** button, and a **Simulate Mesh outage** toggle.

2. **Normal deposit (toggle OFF).** Tap **Deposit crypto**. The app mints a link
   token from its backend and opens the normal Mesh flow (`LinkConnect`). Pick a
   token/network and complete a deposit as usual. Back out to the home screen.
   *(If the backend is unconfigured, you'll see the "needs a link token" hint —
   that's expected; move to the backup path, which is the point of the demo.)*

3. **Kill the primary.** Flip **Simulate Mesh outage** ON. The hint under the
   toggle updates to say the deposit will fail on the primary and fall back.

4. **Backup deposit (toggle ON).** Tap **Deposit crypto** again. The backend
   returns `503` for the link-token call; the app detects the outage
   (`MeshOutageError`) and **automatically** opens `LinkConnectBackup`. The backup
   widget loads from `demo-widget.cascadecode.com` — a **different origin from
   meshconnect.com**, so it's up even when Mesh is down — shows the deposit
   address (QR + copy), and completes the deposit. **A deposit just completed with
   the primary API dead.**

5. **Make the point:** the same fallback fires automatically on a *real* 5xx or
   network failure — the toggle only makes it reproducible on stage.

---

## JIT variant (client-direct address resolution)

The default `'static'` mode shows fixed demo addresses. `'jit'` mode instead has
the **widget** resolve each address by calling the client backend directly — the
OR-452 client-direct JIT contract (`Authorization: Bearer <short-lived token>`,
request mirrors `ManagedJitAddressRequest` + `userId`, response mirrors
`ManagedJitAddressResponse`).

Because the widget runs on a remote origin, the backend's JIT endpoints must be
publicly reachable:

```sh
cloudflared tunnel --url http://localhost:4600      # prints https://<name>.trycloudflare.com
```

Then in [`cdc/demoConfig.ts`](cdc/demoConfig.ts):

```ts
export const PUBLIC_BACKEND_URL = 'https://<name>.trycloudflare.com';
export const BACKUP_MODE = 'jit';
```

Verify the JIT endpoints before the demo, without the app:

```sh
cd examples/backup-mock-backend
API=https://<name>.trycloudflare.com ./run-backup-jit-flow.sh
# To show the loading screen, run the backend with JIT_DELAY_MS=8000
```

---

## Swap-cost proof — cascadecode.com → Mesh-owned is config, not code

The demo currently points at a personal Cloudflare apex (OR-447/OR-448). Migrating
to Mesh-owned infrastructure is **three config edits, zero code changes**:

| Value                         | Where                                   | Demo → Production          |
| ----------------------------- | --------------------------------------- | -------------------------- |
| `DEFAULT_BACKUP_WIDGET_ORIGIN`| `mesh-web-sdk` (web) / `widgetOrigin` prop + `DEMO_BACKUP_WIDGET_ORIGIN` here (RN) | `demo-widget.cascadecode.com` → Mesh backup origin |
| `VITE_BACKUP_PAIRS_URL`       | backup widget build                     | `pairs.cascadecode.com` → Mesh pairs origin |
| `BackupPairs:Endpoint`        | pairs/logos publisher (OR-448)          | personal R2 bucket → Mesh R2 bucket |

In this RN demo, the widget origin is the single constant
`DEMO_BACKUP_WIDGET_ORIGIN` in `cdc/demoConfig.ts` (passed as `widgetOrigin`).
Swapping it is the whole migration on the SDK side — the flow is unchanged.

---

## Troubleshooting

- **"Could not reach the client backend"** — the app can't reach `DEMO_BACKEND_URL`.
  On Android use `http://10.0.2.2:4600`; on a device use your LAN IP; confirm the
  backend is running (`curl $DEMO_BACKEND_URL/healthz`).
- **Backup widget is blank** — check the device can load
  `demo-widget.cascadecode.com` (it must be reachable; it is intentionally not a
  `meshconnect.com` origin).
- **JIT never resolves** — in `'jit'` mode the *widget* calls the backend, so
  `PUBLIC_BACKEND_URL` must be the public tunnel, not `localhost`. Confirm with
  `run-backup-jit-flow.sh` against the tunnel URL.
- **Normal deposit shows a hint instead of the widget** — the backend has no way to
  mint a link token; set `MESH_*` or `DEMO_LINK_TOKEN` (Setup step 2).
