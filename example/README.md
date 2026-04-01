# 🔗 Mesh Connect React Native SDK Example

A working example app demonstrating how to integrate the Mesh Connect React Native SDK. Use it to explore SDK features and as a reference for your own integration.

## 🚀 Getting Started

### 🔨 Step 1: Build Mesh SDK

From the **root** directory:

```sh
yarn
yarn build:watch
```

Keep `build:watch` running — it recompiles the SDK on every change.

### ⚡ Step 2: Start Metro

From the **example** directory:

```sh
yarn start
```

### 📱 Step 3: Build and run the app

#### 🤖 Android

In a separate terminal, from the **example** directory:

```sh
yarn android
```

#### 🍏 iOS

The first time (or after a fresh clone), install Ruby gems from the **example/ios**:

```sh
bundle install
```

Then install native dependencies (repeat after any native dependency update):

```sh
bundle exec pod install
```

Then run from the **example** directory:

```sh
yarn ios
```

### ✏️ Step 4: Modify

Edit files in `example/` or the SDK source in `src/`. Metro reloads JS changes automatically via [Fast Refresh](https://reactnative.dev/docs/fast-refresh). To force a full reload:

- **Android**: Press <kbd>R</kbd> twice, or <kbd>Ctrl</kbd>+<kbd>M</kbd> / <kbd>Cmd ⌘</kbd>+<kbd>M</kbd> to open the Dev Menu.
- **iOS**: Press <kbd>R</kbd> in the Simulator.

### 🐛 Step 5: Debug

With Metro running, press <kbd>j</kbd> in the Metro terminal to open React Native DevTools.
