# KinMatch iOS app (Capacitor)

The KinMatch iOS shell wraps the production web app in a native WebView and uses the system microphone permission dialog.

## Prerequisites

- macOS with Xcode installed
- Apple Developer account (for TestFlight)
- Node.js 22+ (Capacitor CLI 8 requirement) and npm

## Setup

```bash
npm install
npm run cap:sync
npm run cap:ios
```

This opens the Xcode workspace. Select a development team under **Signing & Capabilities**, then run on your iPhone or simulator.

## How it loads the app

`capacitor.config.ts` points at `https://kin-matchmvp.vercel.app`, so the native app always uses the latest deployed web UI. The `native-shell/` folder is only a offline placeholder for Capacitor sync.

## Microphone

- **Info.plist** includes `NSMicrophoneUsageDescription`.
- Recording uses `@capgo/capacitor-audio-recorder` in the native app, with automatic fallback to in-browser recording if native fails.
- Users can fix denied permission under **Settings → KinMatch → Microphone**.

## TestFlight (outline)

1. Archive in Xcode (**Product → Archive**)
2. Upload to App Store Connect
3. Add internal testers in TestFlight
4. Share the TestFlight invite link

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run cap:sync` | Copy web assets + sync native projects |
| `npm run cap:ios` | Open Xcode |

## Auth note

Magic-link sign-in should redirect back to the app. If links open in Safari instead of the app, add a custom URL scheme or universal link in a follow-up pass.
