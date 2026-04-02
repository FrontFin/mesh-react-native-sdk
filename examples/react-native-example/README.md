# 🔗 Mesh Connect React Native SDK Example

A working example app demonstrating how to integrate the Mesh Connect React Native SDK. Use it to explore SDK features and as a reference for your own integration.

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

In a new Terminal window, build and android app from `examples/react-native-example` directory:

```sh
yarn android
```

#### 🍏 iOS

Install native dependencies for iOS from `examples/react-native-example/ios` directory:

```sh
bundle install
bundle exec pod install
```

In a new Terminal window, build and ios app from `examples/react-native-example` directory:

```sh
yarn ios
```

### ✏️ Step 4: Modify

After making changes you have to re-build the sdk, from the `root` directory:

```sh
yarn build
```

And reload an example app, from `examples/react-native-example` directory:

```sh
yarn reload
```

Than click <kbd>r</kbd> to reload the app.

### 🐛 Step 5: Debug

With Metro running, press <kbd>d</kbd> in the Metro terminal to open React Native DevTools.

> [!NOTE]
> The project will be re-stuctured to use a workspaces to achieve Fast Refresh.
