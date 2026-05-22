# Native voice recording — QA checklist

Run on **real devices** before App Store / Play Store submission.

## Web (Safari / Chrome mobile)

| Step | Expected |
|------|----------|
| First tap record on voice-note screen | Browser mic prompt appears |
| Allow | Waveform animates; stop produces playable blob |
| Deny | Permission card shows Allow / Try again / Safari settings hint |
| Denied + "Record in Voice Memos instead" | System recorder opens; file uploads on send |
| Onboarding "Set up voice notes" | Same prompt; continues on allow |

## Android app (`npx cap run android`)

| Step | Expected |
|------|----------|
| Fresh install → record | OS microphone permission dialog |
| Allow | Records up to 1:30; upload succeeds |
| Deny → Open settings | App settings opens; after allow, record works |
| Re-open app | Permission remembered |

## iOS app (after `npx cap add ios` on Mac)

| Step | Expected |
|------|----------|
| Fresh install → record | iOS microphone permission dialog |
| Allow | AAC/mp4 upload; public listen page plays |
| Deny → Open settings | iOS Settings → KinMatch → Microphone |
| Magic link sign-in | Email link opens app via `kinmatch://auth/callback` |

## Backend

- `POST /api/voice-notes/send` accepts `audio/mp4`, `audio/webm`, `audio/m4a`
- Peaks JSON array length ≤ 30

## Known limits

- Web cannot bypass microphone permission (by design).
- Capacitor CLI 8+ requires Node 22; this repo uses Capacitor 7 for Node 20 CI/dev machines.
