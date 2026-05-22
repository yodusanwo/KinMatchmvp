# KinMatch iOS (Capacitor)

The iOS project is generated on a Mac with CocoaPods installed.

## One-time setup

1. Install **Xcode** from the Mac App Store (not only Command Line Tools).
2. Point the active developer directory at Xcode:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

3. Install CocoaPods and sync:

```bash
brew install cocoapods
cd "/path/to/KinMatch MVP"
npx cap sync ios
```

If `ios/` is broken (missing `Podfile`), remove it and re-add:

```bash
rm -rf ios
npx cap add ios
npx cap sync ios
```

## Microphone permission

`ios/App/App/Info.plist` includes `NSMicrophoneUsageDescription`.

## URL scheme (magic link auth)

`Info.plist` includes URL scheme `kinmatch`. Also add to Supabase Auth → Redirect URLs:

```
kinmatch://auth/callback
```

## Open the project

```bash
npx cap open ios
```
