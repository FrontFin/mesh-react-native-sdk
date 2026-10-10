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
call. The SDK loads the HTML, then delivers `MeshBackupConfig` over the same
message bridge the widget uses in Tier 1, and the widget signals readiness with its
usual `loaded` handshake. The only change the SDK makes to the HTML is the theme:
an inline-HTML source can't carry Tier 1's `?theme=`, so `withWidgetTheme()`
(`index.ts`) adds `data-theme="dark|light"` to the root `<html>` tag. That
attribute is outside every CSP hash; the rest of the document is unchanged.

## Drift / refresh (release checklist)

The snapshot **drifts** between releases: a pair added after a client's installed
SDK version isn't in it. Tier 2 does **not** filter by pair. Every configured
destination is offered, and one whose pair is missing from the snapshot takes its
network's name (and any bundled token/network logo) from the rest of the snapshot.
The one case drift hides is a destination on a **network** the snapshot doesn't
contain at all (a chain added after this SDK build): the widget can't name that
network offline, so it isn't offered until a release ships a newer snapshot. If no
configured destination can be offered, Tier 2 shows an error. (An invalid/corrupt
snapshot is treated as "no catalog": only destinations on the widget's built-in top
networks remain.) The snapshot only supplies names/logos and decides which networks
can be named. The address always comes from `MeshBackupConfig` or the client's JIT
callback, never the snapshot. Tokens and networks outside the curated top-N logo
set render an initials placeholder.

**On every SDK release**, re-vendor both files from `mesh-backup-widget` (rebuild
its Phase 6a snapshot from the current `all.json`, then its Phase 6b offline
widget), copy them here, run `yarn bundle:embed`, and commit. `yarn bundle:check`
(also run in CI) enforces the size budget, the top-N logo cap, and that
`generated.ts` is in sync.
