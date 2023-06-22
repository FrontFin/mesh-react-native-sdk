# Front-Finance-Expo-App

## Quick Start

The Expo EAS project's structure will look similar to this:

```
Expo-project
├── assets
├── utility
│   ├── config.js
├── README.md
├── App.js
├── app.json
├── babel.config.js
├── eas.json
└── package.json

```

**App.js**
The App.js file is the default screen of your project. It is the root file that you'll load after running the development server with npx expo start. You can edit this file to see the project update instantly. Generally, this file will contain root-level React Contexts and navigation.

**eas.json**
eas.json is the configuration file for EAS CLI and services. It is located at the root of your project next to your package.json. Configuration for EAS Build all belongs under the build key.

**utility**
This is a great place to put miscellaneous helpers and utilities. Things like date helpers, formatters, etc. are often found here. However, it should only be used for things that are truely shared across your application. If a helper or utility is only used by a specific component or model, consider co-locating your helper with that component or model.

**app.json** This is the entry point to your app. This is where you will find the main The app.json file contains configuration options for the project. These options change the behavior of your project while developing, in addition to while building, submitting, and updating our app.


### Get Started

First you must have setup expo cli by running
- npm install -g expo-cli

The next thing you need is a Expo Go client app which you can download it from playstore or app store

PlayStore - https://play.google.com/store/apps/details?id=host.exp.exponent&pli=1
AppStore - https://apps.apple.com/app/expo-go/id982107779

**Starting a Development Server**
- npx expo start

This command will help you to connect the expo go client with terminal via scanning qr-code and fetch the application where you can see you live changes.

### Build 
For building development or anyother kind of a build you need EAS-CLI, EAS CLI is the command-line app that you will use to interact with EAS services from your terminal. To install it, run the command:
- npm install -g eas-cli

you may have to login to your expo account
- eas login

**For Android**
eas build --platform android

**For iOS**
eas build --platform ios

however as per this project the recommended way for running a build command using the following pattern

- eas build --profile `Profile Name`.

This `Profile Name` could be any of the following as per the usecase:
- preview 
- staging
- production

# Front-Finance-Expo-App
