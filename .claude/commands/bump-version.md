---
name: bump-version
description: >
  Bumps the mesh-react-native-sdk version using semantic versioning, then updates CHANGELOG.md.
  Use this skill whenever the user asks to bump the version, release a new version, update
  the version number, prepare a release, or update the changelog. Also trigger when the user
  says things like "we're ready to release" or "what version should this be?".

  Steps: diff HEAD against the latest git tag → classify changes as MAJOR/MINOR/PATCH →
  increment the `version` field in package.json → prepend a new entry to CHANGELOG.md.
---

## bump-version skill

### Step 1 — Sync with remote, find the latest tag, and build the diff

First, fetch the latest commits and all tags from origin so the diff reflects the true
published state rather than a stale local snapshot:

```bash
git fetch origin main --tags
```

Then find the latest tag using the same selection and normalisation logic as `release.yaml`
(semver-sorted, leading `v` stripped):

```bash
LATEST_TAG=$(git tag --sort=-v:refname | head -n 1)
LATEST_TAG="${LATEST_TAG#v}"   # strip optional leading 'v'
LATEST_TAG="${LATEST_TAG// /}" # strip any surrounding whitespace
echo "Latest tag: ${LATEST_TAG:-<none>}"
```

If no tags exist (`LATEST_TAG` is empty), treat the full history as the diff
(use `git log --oneline` for context) and assume the current version in `package.json`
is the starting point.

```bash
git diff <latest-tag>..HEAD --stat
git diff <latest-tag>..HEAD -- \
  'src/types/index.ts' \
  'src/components/LinkConnect.tsx' \
  'src/index.ts'
```

Also capture the commit log for the changelog summary:

```bash
git log <latest-tag>..HEAD --oneline
```

---

### Step 2 — Classify the bump

Analyse the diff output against these rules (apply the highest matching level):

#### MAJOR — any of:
- An exported interface or type in `src/types/index.ts` is **deleted or renamed**
- A **required field** is added to `LinkConfiguration` (breaks existing callers)
- An **existing field** is removed from `LinkConfiguration`, `LinkPayload`, `AccessTokenPayload`,
  `DelayedAuthPayload`, `TransferFinishedSuccessPayload`, or `TransferFinishedErrorPayload`
- The `LinkConnect` component's required props change in a breaking way (removal or rename)
- `LinkEventTypeKeys` loses a previously supported event key

#### MINOR — any of (and no MAJOR):
- A **new optional field** is added to `LinkConfiguration`, `LinkSettings`, or any public payload type
- A **new exported interface or type** is added to `src/types/index.ts`
- A **new event type** is added to `LinkEventType` union or `LINK_EVENT_TYPE_KEYS`
- The `LinkConnect` component gains new **optional** props
- A new public utility or hook is exported from `src/index.ts`

#### PATCH — everything else:
- Bug fixes, internal refactors, test additions or changes
- README, CHANGELOG, or `CLAUDE.md` edits
- Dependency version bumps that don't affect the public API
- New or changed private/internal functions
- Changes to `examples/`, `scripts/`, or CI workflow files

When in doubt between MINOR and PATCH, prefer MINOR. When in doubt between MAJOR and MINOR,
**ask the user** before proceeding — a wrong MAJOR bump is hard to undo after publishing.

---

### Step 3 — Read and bump the version

Read the current version:

```bash
node -p "require('./package.json').version"
```

Apply the bump:
- **MAJOR**: increment first number, reset others to 0  →  `2.3.0` → `3.0.0`
- **MINOR**: increment second number, reset third to 0  →  `2.3.0` → `2.4.0`
- **PATCH**: increment third number                     →  `2.3.0` → `2.3.1`

Write the new version back using Edit — change only the `"version"` line in `package.json`,
nothing else.

---

### Step 4 — Update CHANGELOG.md

All changelog entries must follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

Read `CHANGELOG.md` if it exists (it may not).

Prepend a new section at the very top (above any existing content):

```markdown
## X.Y.Z

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

Rules for the summary:
- Do **not** include a date — use only the version number: `## X.Y.Z`.
- **Always** include at least one `### Added` / `### Changed` / `### Fixed` / `### Removed` sub-heading — never write bare bullets directly under a version heading. Omit section headings that have no items, but every version block must have at least one.
- Keep each bullet to one line — describe **what changed and why it matters** to a consumer of
  the SDK, not internal implementation details. Example:
  - ✅ `Added \`theme\` field to \`LinkSettings\` for light/dark/system UI theming`
  - ❌ `Modified SDKContainer to pass theme query param to WebView`
- Changes in `examples/`, tests, `CLAUDE.md`, and `README.md` go under **Changed** only if they
  affect the developer experience; skip purely internal ones.
- If CHANGELOG.md did not exist, create it with a short header before the first entry:

```markdown
# Changelog

All notable changes to the Mesh Connect React Native SDK are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## X.Y.Z
...
```

---

### Step 5 — Report to the user

After writing the files, summarise:

```
Bumped version: 2.3.0 → 2.4.0  (MINOR)

Reason: added `theme` field to `LinkSettings`, new `LinkTheme` type export.

Files updated:
  • package.json   (version field)
  • CHANGELOG.md   (new entry prepended)
```

Then ask the user:

> Would you like me to commit these changes?

If they say yes, stage only the two modified files and create a commit:

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
```

If they say no, leave the files as-is.
