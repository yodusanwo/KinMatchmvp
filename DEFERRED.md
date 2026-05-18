# KinMatch — Come back to later

Items intentionally skipped during the pilot build. Check these off when done.

---

## Authentication

### Google sign-in
- [ ] Create OAuth client in [Google Cloud Console](https://console.cloud.google.com/) (Web application)
- [ ] **Authorized redirect URI:** `https://zlhbfhmwawqdewaotxkq.supabase.co/auth/v1/callback`
- [ ] **Authorized JavaScript origins:** `http://localhost:3000`, your production URL
- [ ] Paste **Client ID** + **Client secret** in Supabase → **Authentication → Providers → Google**
- [ ] Add `signInWithOAuth({ provider: 'google' })` button on `/signin` (below email form or divider)
- [ ] Add production callback URL to Supabase **Redirect URLs** when deployed

**Why deferred:** Email magic link is enough for the pilot; Google requires Cloud Console setup.

---

## Supabase dashboard

- [ ] **Authentication → URL configuration** (fixes magic links going to `localhost`)
  - **Site URL:** your production URL, e.g. `https://kin-matchmvp.vercel.app` (not localhost — that is why email links open `localhost:3000/?code=...`)
  - **Redirect URLs** (add all of these):
    - `https://YOUR-VERCEL-URL/auth/callback`
    - `http://localhost:3000/auth/callback` (local dev only)
  - In **Vercel → Environment Variables**, set `NEXT_PUBLIC_APP_URL` to the same production URL, then redeploy
  - Request a **new** magic link from the live site after saving (old emails still point at localhost)
- [ ] **Authentication → Email templates** — customize magic link email copy to match KinMatch voice (optional)
- [ ] Confirm **Email** provider enabled (magic link / OTP)

### “Email rate limit exceeded” (Supabase built-in mail)

Supabase’s default auth email is capped (often **~4 emails/hour per address** on free tier). Hitting it during testing is normal.

**Right now:**
- Wait **30–60 minutes**, then request **one** new link from production `/signin`
- Avoid clicking “send” repeatedly while testing

**For pilot / production (recommended):**
- [ ] Supabase → **Project Settings → Authentication → SMTP Settings** → enable **custom SMTP**
- [ ] Use [Resend](https://resend.com), SendGrid, or Postmark (free tiers are enough for pilot)
- [ ] Optional: **Authentication → Rate limits** — review OTP/email limits after SMTP is connected

---

## Vercel / production

- [ ] Add env vars on Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Add production redirect URL in Supabase after first deploy
- [ ] Custom domain (`kinmatch.app` / `kinmatch.co`) when ready

### Voice notes & email (when you deploy to Vercel)

Locally, voice note audio uploads to **Supabase Storage** using `SUPABASE_SECRET_KEY` (no Vercel deploy required).

When you deploy to Vercel later, set `BLOB_READ_WRITE_TOKEN` and uploads will use **Vercel Blob** (private store) instead of Supabase Storage. Audio is served via `/api/v/[shareToken]/audio` — not a direct blob URL.

Add these env vars in the Vercel dashboard:

| Variable | Purpose |
|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob private store (optional; Supabase Storage works without it) |
| `KLAVIYO_PRIVATE_API_KEY` | Voice-note-received emails |
| `ANTHROPIC_API_KEY` | Paste-to-memory extraction (Day 11) |
| `ANTHROPIC_MODEL` | Optional; defaults to `claude-sonnet-4-5-20250929` |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://your-app.vercel.app` for listen links |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional; e.g. `kin-matchmvp.vercel.app` for Day 13 analytics |

### Plausible analytics (Day 13)

Optional. Without `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, the app works normally — events are no-ops.

- [ ] Create a site in [Plausible](https://plausible.io/) (or self-hosted)
- [ ] Set **Vercel env:** `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to your domain (no `https://`)
- [ ] Redeploy; confirm custom events in Plausible: `onboarding_started`, `onboarding_completed`, `voice_note_sent`, `memory_added`, `capture_from_paste_used`

### Klaviyo — Voice note received email (Day 10)

Dashboard setup (not in code):

- [ ] Create Klaviyo account / use existing
- [ ] Create flow triggered by metric `kinmatch_voice_note_received`
- [ ] Email template: subject `[Sender] sent you a voice note`, body with play link to `{{ event.voice_note_url }}` (or equivalent property from the API event)
- [ ] Test: record → send with recipient email → open link → lands on `/v/[share_token]`

---

## Repo / tooling

- [ ] Commit `supabase/config.toml` + link state (if not already pushed)
- [ ] Homebrew Supabase CLI install failed (macOS CLT issue) — using `npx supabase` works; optional: fix CLT and `brew install supabase/tap/supabase`

### Dev server "Internal Server Error" on `/signin`

Usually a **stale Turbopack cache** or **two `npm run dev` processes** (one on 3000, one on 3002).

```bash
# Stop dev server (Ctrl+C), then:
lsof -ti:3000 | xargs kill -9   # free port 3000
rm -rf .next
npm run dev
```

If it persists, try without Turbopack: `npx next dev` (no `--turbopack`).

---

## Build plan — next days (not deferred, just queued)

| Day | Focus |
|-----|--------|
| ~~Day 4~~ | ~~Reflection Q1, Q2, Q3~~ — done |
| ~~Day 5~~ | ~~Tribe reveal, Held, email prefs, complete API~~ — done |
| ~~Day 6~~ | ~~Today screen + Person Profile (begin)~~ — done |
| **Day 7** | Finish profile + memory capture modal |
| **Day 5** | Tribe reveal, Held setup, email prefs, account creation |
| **Day 6+** | Today screen, profiles, voice notes |

---

## Security note

Never commit `.env.local`. `SUPABASE_SECRET_KEY` is server-only — do not expose as `NEXT_PUBLIC_*`.
