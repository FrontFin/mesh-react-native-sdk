# 🔗 Mesh Connect React Native SDK Example

A working example app demonstrating how to integrate the Mesh Connect React Native SDK.

## 🚀 Getting Started

### 🔨 Step 1: Build Mesh SDK

Install dependencies and build the SDK from the `root` directory:

```sh
yarn
yarn build
```

### ⚡ Step 2: Start Metro

Install dependencies and start Metro from the `examples/react-native-example` directory:

```sh
yarn
yarn start
```

### 📱 Step 3: Build and run the app

#### 🤖 Android

In a new Terminal window build an android app from `examples/react-native-example` directory:

```sh
yarn android
```

#### 🍏 iOS

Install native dependencies for iOS from `examples/react-native-example/ios` directory:

```sh
bundle install
bundle exec pod install
```

In a new Terminal window build an iOS app from `examples/react-native-example` directory:

```sh
yarn ios
```

### ✏️ Step 4: Modify

After making changes you have to re-build the SDK from the `root` directory:

```sh
yarn build
```

Then reinstall the dependencies for example app from `examples/react-native-example` directory:

```sh
yarn reinstall
```

And click <kbd>R</kbd> to reload the app.

### 🐛 Step 5: Debug

With Metro running, press <kbd>D</kbd> in the Metro terminal to open React Native DevTools.

> [!NOTE]
> The project will use workspaces soon.

## 🛟 Backup deposit flow, Tier-2 fallback & JIT callbacks

The home screen has a **Simulate outage — Backup deposit** button that opens the
deposit-only backup flow. It uses the same SDK entry point as the normal flow —
`<LinkConnect backupConfig={…}>` in place of `linkToken` — loaded from the backup
widget origin (**Tier 1**).

**Force JIT (address-less):** flip this toggle to drop the static addresses so each
destination is resolved through the `onAddressInit` / `onStatusPoll` callbacks,
which run in this app (no token, no client endpoint in the widget). The example
wires a small in-app mock resolver (`pending` a couple of polls, then `ready`).
Pair it with **Force Tier-2** to run JIT end to end against the bundled
callback-widget — a full deposit with zero Mesh-owned network calls.

Toggle **Force Tier-2 fallback** before pressing it to point the widget at an
unreachable origin. The Tier-1 load fails, so the SDK cascades to the **bundled
Tier-2 offline widget** (no Mesh-owned network dependency, OR-474). A banner at the
bottom of the flow shows which tier is live (`○ Tier 1 …` / `● Tier 2 · bundled
offline widget`), and the cascade is logged in Metro as a `backupTierChanged`
event. Because Tier 2 is served from the SDK bundle, this works even with the
device fully offline.

> Rebuild the SDK from the repo root (`yarn build`) before running so the example's
> linked `../../dist` build includes the bundled Tier-2 widget.
