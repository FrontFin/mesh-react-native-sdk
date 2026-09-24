# CDC-lookalike backup demo — mock client backend (OR-453)

A tiny stand-in for a B2B client's own backend (think Crypto.com), used by the
CDC-lookalike backup demo. It exposes only what the demo needs:

| Method + path             | Purpose                                                                   | Auth              |
| ------------------------- | ------------------------------------------------------------------------- | ----------------- |
| `POST /linktoken`         | Mint a Mesh link token (the **normal** deposit path). Can fail on demand. | client secret¹    |
| `POST /backup/token`      | Mint a short-lived, user-scoped bearer token for the backup JIT calls.    | none              |
| `POST /backup/jit/initiate` | Begin backup deposit-address resolution.                                | `Bearer <token>`  |
| `GET  /backup/jit/status` | Poll until the address is `ready`.                                        | `Bearer <token>`  |
| `GET  /healthz`           | Liveness.                                                                 | none              |

¹ The mock accepts the client secret as env config (below), not per-request — a
real client backend holds it server-side, exactly like this.

Python 3 standard library only — no `pip install`. Ported from FrontBackEnd's
`scripts/jit-local-mock/`, but adapted from the **Mesh-facing** JIT contract
(Mesh calls the client, mutual-HMAC signed) to the **client-direct** contract of
OR-452 (the backup widget calls the client, `Authorization: Bearer …`). The
request mirrors `ManagedJitAddressRequest` + `userId`; the response mirrors
`ManagedJitAddressResponse` (`ready | pending | error`, HTTP 200 for every
expected outcome, fail-closed on a bad/expired token).

## Run

```sh
python3 mock_client_backend.py            # listens on 0.0.0.0:4600
python3 mock_client_backend.py 5000       # …or another port
```

It binds `0.0.0.0` so an emulator, a real device, or a tunnel can reach it.

## Configuration (env)

Everything is optional — with no config, the **backup** flow works fully and the
**normal** flow returns `configured: false` (the app shows a hint). That split is
the point of the demo: the backup path needs no Mesh credentials.

| Env                                          | Default | Effect                                                                    |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `MESH_API_BASE` / `MESH_CLIENT_ID` / `MESH_CLIENT_SECRET` | –       | Proxy real link tokens from Mesh on `POST /linktoken` (live normal path). |
| `DEMO_LINK_TOKEN`                            | –       | Alternative to the proxy: return a link token you minted by hand.         |
| `BACKUP_TOKEN_TTL_S`                         | `600`   | Backup-token lifetime, clamped to ≤ 600s (OR-452's 10-min cap).           |
| `JIT_MODE`                                   | `ready` | `ready` resolves; `pending` never resolves; `error` is terminal.          |
| `JIT_DELAY_MS`                               | `0`     | Answer `pending` this long before `ready`, so the widget's loading screen shows. |

> **Throwaway local fixtures.** The demo deposit addresses in the source are for
> showing the QR/copy screen only — **never send real funds to them.**

## Verify without the app

```sh
./run-backup-jit-flow.sh                  # mint token → initiate → poll → address
JIT_DELAY_MS=8000 python3 mock_client_backend.py   # (in another shell) see it go pending→ready
```

## How the demo uses it

- **Normal deposit:** the RN app calls `POST /linktoken` and opens `LinkConnect`
  with the returned token. Flip the app's **Simulate Mesh outage** toggle and the
  app sends `simulateOutage: true`; the backend returns `503`, the app treats
  that as an outage and falls back to the backup widget.
- **Backup deposit:** the app calls `POST /backup/token` for a short-lived
  bearer, assembles a `MeshBackupConfig` whose `jit` block points at
  `…/backup/jit/initiate` and `…/backup/jit/status`, and hands it to
  `LinkConnectBackup`. The **widget** (not the app) then calls those endpoints
  with the bearer to resolve the deposit address.

Because the widget runs on a remote origin (`demo-widget.cascadecode.com`), the
JIT endpoints must be reachable from the public internet for the JIT variant —
expose this mock with a tunnel (`cloudflared tunnel --url http://localhost:4600`)
and set the app's `DEMO_BACKEND_URL` to the tunnel URL. The **static-address**
backup variant needs no tunnel. See `../react-native-example/CDC-DEMO.md`.
