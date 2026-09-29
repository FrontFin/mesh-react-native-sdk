# Tier-2 backup bundle (OR-474 / design §5H)

The **Tier-2 "super redundancy"** fallback: if the independent backup origin
(Tier 1) is unreachable, `LinkConnectBackup` cascades to this bundled widget and
renders a deposit with **zero Mesh-owned network dependency**. The client's JIT
callbacks run in the host app and are identical in both tiers.

## Files (vendored from `mesh-backup-widget`)

| File | Produced by | Shipped? | Notes |
|---|---|---|---|
| `widget.offline.html` | OR-473 offline build (`pnpm build:offline`) | **yes** (via `generated.ts`) | Self-contained: inlined CSS/JS **and** the Phase 6a catalog snapshot + top-N logos. The only asset the SDK loads at runtime — `source={{ html }}`. |
| `catalog.snapshot.json` | OR-472 snapshot build (`pnpm snapshot:build`) | no | Kept for drift diffing and the size guard only. Its contents are already inlined into `widget.offline.html`; the SDK never reads it directly. |
| `generated.ts` | **auto-generated** | yes | `widget.offline.html` projected into a TS string module the SDK imports (Metro can't import raw `.html`). Regenerate with `yarn bundle:embed`. |

The widget is **compile-time Tier-2 aware** (`IS_TIER2_OFFLINE`): it reads the
inlined snapshot in place of a live manifest fetch and makes no Mesh-owned network
call. The SDK injects **nothing** into it — it only loads the HTML, then delivers
`MeshBackupConfig` over the same message bridge the widget uses in Tier 1, and the
widget signals readiness with its usual `loaded` handshake.

## Drift / refresh (release checklist)

The snapshot **drifts** between releases — a pair added after a client's installed
SDK version won't have a bundled name/logo. Drift is **display-only**: such a pair
still works in Tier 2 (initials placeholder + the config's own symbol; the address
comes from `MeshBackupConfig` or the client's JIT callback, never the snapshot).

**On every SDK release**, re-vendor both files from `mesh-backup-widget` (rebuild
its Phase 6a snapshot from the current `all.json`, then its Phase 6b offline
widget), copy them here, run `yarn bundle:embed`, and commit. `yarn bundle:check`
(also run in CI) enforces the size budget, the top-N logo cap, and that
`generated.ts` is in sync.
