# Road Trip Arcade Native App Shell

This repo has Capacitor Android and iOS shells so the existing HTML/JS game can live inside native apps while the web build remains the source of truth.

## Structure

- `capacitor.config.json` defines the native app id, name, and generated web directory.
- `scripts/prepare-capacitor-web.js` builds `app/www` from the current static game files.
- `android/` is the generated Android project.
- `ios/` is the native Xcode workspace and iOS project.
- `app/www/`, `android/app/src/main/assets/public/`, and `ios/App/App/public/` are generated and ignored.

Both native apps use the identifier `com.roadtriparcade.app` and display the name Road Trip Arcade.

The app opens on Home. Inside the generated app bundle:

- `home.html` is copied to `index.html` and `home.html`.
- Window Dash's `index.html` is copied to `runner.html`.
- Wheel Jam stays at `tap/index.html`.

## Commands

```sh
npm install
npm run app:sync
npm run app:build:android
npm run app:install:android
npm run app:android
npm run app:build:ios
npm run app:archive:ios
npm run app:run:ios
npm run app:ios
```

Run `npm run app:sync` after changing game files to copy the latest web bundle into both native projects. Use `app:sync:android` or `app:sync:ios` when working on only one platform.

## iOS Build Note

The iOS app requires Xcode and CocoaPods. `app:build:ios` creates an unsigned Simulator build at:

```txt
/tmp/road-trip-arcade-ios-build/Build/Products/Debug-iphonesimulator/App.app
```

For a physical iPhone, run `npm run app:ios`, select the App target in Xcode, choose the Apple developer team under Signing & Capabilities, select the connected iPhone, and press Run.

For TestFlight, create the `com.roadtriparcade.app` record in App Store Connect first. After signing is configured in Xcode, `npm run app:archive:ios` creates `/tmp/RoadTripArcade.xcarchive`; upload that archive through Xcode Organizer.

## Android Build Note

Capacitor 7's Android project requires JDK 21. This machine has Homebrew `openjdk@21` installed at:

```txt
/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

The `app:build:android` and `app:install:android` scripts point Gradle at that JDK explicitly, so the global terminal Java can stay on JDK 17.

The debug APK is generated at:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

## Save State

The web game still uses `localStorage` as its normal save path. In a Capacitor app, `save.js` also mirrors the save blob into native Preferences. If WebView storage is empty on app boot, it restores from the native backup and dispatches `rtr-save-restored` so screens can redraw.
