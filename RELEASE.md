# Release React Native SDK

> [!IMPORTANT]
> **Refresh the Tier-2 backup bundle before every release.** The bundled offline
> deposit fallback (`src/backup-bundle/`) ships a snapshot of the supported-pairs
> catalog that **drifts** between releases. Regenerate `widget.offline.html` +
> `catalog.snapshot.json` from the current `all.json` (the Phase 6a / OR-472
> build step), then run `yarn bundle:embed` and commit the refreshed files
> (including `generated.ts`). `yarn bundle:check` (also run in CI) enforces the
> size budget and that the generated module is in sync. Drift is display-only —
> a newer pair still works via the initials fallback — but a stale bundle means
> majors added since the last release render without their name/logo in Tier 2.

## ✨ With Claude Code (recommended)

1. Run `/bump-version` — bumps version according to [Semantic Versioning](https://semver.org/) and prepends a new entry to `CHANGELOG.md`.
2. Merge into `main`.
3. The release workflow starts automatically on merge to `main`. Optionally run [Release](https://github.com/FrontFin/mesh-react-native-sdk/actions/workflows/release.yaml) workflow manually.
4. Verify the new version appears on [npm](https://www.npmjs.com/package/@meshconnect/react-native-link-sdk).

## ✍🏼️ Manually

1. Update `version` in [package.json](./package.json) according to [Semantic Versioning](https://semver.org/).
2. Add a new entry to `CHANGELOG.md`.
3. Merge into `main`.
4. The release workflow starts automatically on merge to `main`. Optionally run [Release](https://github.com/FrontFin/mesh-react-native-sdk/actions/workflows/release.yaml) workflow manually.
5. Verify the new version appears on [npm](https://www.npmjs.com/package/@meshconnect/react-native-link-sdk).

> [!NOTE]
> Publication on npm is usually available within a minute after the workflow finishes.
