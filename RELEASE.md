# Release React Native SDK

## ✨ With Claude Code (recommended)

1. Run `/bump-version` — bumps to the correct version according to [Semantic Versioning](https://semver.org/) and prepends a new entry to `CHANGELOG.md`.
2. Merge into `main`.
3. The release workflow starts automatically on merge to `main`. Optionally trigger [Release](https://github.com/FrontFin/mesh-react-native-sdk/actions/workflows/release.yaml) workflow manually.
4. Verify the new version appears on [npm](https://www.npmjs.com/package/@meshconnect/react-native-link-sdk).

## ✍🏼️ Manually

1. Update `version` in [package.json](./package.json) according to [Semantic Versioning](https://semver.org/) and prepend a matching entry to `CHANGELOG.md`.
2. Merge into `main`.
3. The release workflow starts automatically on merge to `main`. Optionally trigger [Release](https://github.com/FrontFin/mesh-react-native-sdk/actions/workflows/release.yaml) workflow manually.
4. Verify the new version appears on [npm](https://www.npmjs.com/package/@meshconnect/react-native-link-sdk).

> [!NOTE]
> Publication on npm is usually available within a minute after the workflow finishes.

> [!TIP]
> For publishing issues, contact [@vitalii-movchan-mesh](https://github.com/vitalii-movchan-mesh).
