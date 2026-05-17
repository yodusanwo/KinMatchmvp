# KinMatch — 14-Day Pilot MVP Scaffolding Plan

**Today:** May 17, 2026 · **Deadline:** May 31, 2026 · **Days:** 14 · **Mode:** Solo founder vibe-coding in Cursor

---

## What "done by May 31" actually means

**This is a pilot MVP, not a public launch product.** The distinction matters:

- ✅ **Pilot MVP:** End-to-end working flow for 5–10 hand-picked waitlist users. Rough edges visible. Some features manually triggered or mocked. Goal: validate the wedge with real users in real life.
- ❌ **Public launch:** Polished, automated, scaled. Daily AI spotlights firing on cron. Sunday Voice Drop running. Full Klaviyo flow automation. App Store presence. That's 4–6 weeks beyond May 31.

The pilot MVP is a means to a public launch, not a substitute for one. Pilot users will tell you what to invest in for the launch version.

---

## Scope decisions for the 14-day pilot

**Shipping:**
- Full onboarding flow (Screens 1–9)
- Today screen with manually-curated or simple-rule spotlight
- Person Profile (read + manual memory editing)
- Voice note recording + sending via web link
- Memory capture (manual typing + paste-from-message + Claude extraction)
- Basic Held configuration (stored, displayed, but not yet firing alerts automatically)
- Welcome email + voice note received email via Klaviyo

**Deferred to v1.1:**
- Daily spotlight cron + automated trigger engine (use static demo data + simple drift rules for pilot)
- Sunday Voice Drop ritual emails
- Held alert cron + automated emails (manual triggering for pilot if needed)
- Whisper transcription (voice notes play without transcripts in pilot)
- AI suggestion layer's contextual intelligence (static menu for pilot)
- Voice notes inbox screen (just show recent in profile for pilot)
- Post-send memory capture flow (manual capture only for pilot)
- Native push notifications
- SMS notifications

**SMS/WhatsApp memory ingestion approach:**
For the pilot, use a **paste-based capture flow**: user copies a message thread from iMessage, WhatsApp, or any messaging app, pastes into KinMatch, picks the friend, taps extract → Claude returns 1–3 memory candidates → user saves. This works on every device and requires zero integration. Native share-sheet integration is a v1.1 enhancement.

---

## Day-by-day plan

### DAY 1 — Sunday, May 17 (today, evening)

**Goal:** Foundation set up, can render a blank page on Vercel.

**Tasks:**
1. Create Next.js 15 project: `npx create-next-app@latest kinmatch --typescript --tailwind --app`
2. Install dependencies: `npm install @supabase/supabase-js @supabase/ssr lucide-react`
3. Set up Supabase project at supabase.com (free tier)
4. Add brand tokens as CSS variables in `globals.css`
5. Configure Tailwind to use brand tokens
6. Push to GitHub, deploy to Vercel, confirm the blank page renders at `kinmatch-pilot.vercel.app` or similar
7. Set up `.env.local` with Supabase keys

**Cursor prompt for tonight:**
> Set up a Next.js 15 App Router project with TypeScript and Tailwind. Configure Tailwind to use these brand colors as CSS variables in globals.css and tailwind.config.ts: cream `#F2EAD9`, cream-deep `#EBE0C9`, ink `#1F1A14`, ink-soft `#463C2E`, terracotta `#B65232`, terracotta-deep `#8E3D22`, forest `#2F4032`, sage `#6B7A5C`, mustard `#C68F3E`, honey `#E8D494`. Set the body background to cream and default text to ink. Import Inter and Instrument Sans from Google Fonts. Create a basic homepage that renders "KinMatch" in Inter italic, terracotta, on cream background to verify everything works.

**End-of-day check:** Vercel deploy renders a cream page with "KinMatch" in italic terracotta. Supabase project created.

---

### DAY 2 — Monday, May 18

**Goal:** Database schema live in Supabase. Brand component library started.

**Tasks:**
1. Write Supabase SQL migration for all 11 tables from the build spec (run via Supabase SQL editor or `supabase db push`)
2. Set up Row-Level Security policies for each table
3. Build the core brand component library:
   - `<BrandBar>` (small mark + wordmark)
   - `<BrandMark>` (the Overlap SVG logo)
   - `<Eyebrow>` (11px uppercase, 0.12em letter-spacing)
   - `<Headline>` (22px, 500 weight)
   - `<Subhead>` (italic, color-soft)
   - `<PrimaryButton>` (terracotta pill)
   - `<SecondaryButton>` (outlined pill)
   - `<TextLink>` (underlined, terracotta)
4. Create a `/dev` route to preview all components

**Cursor prompt:**
> I'm building KinMatch, a voice-first friendship app. Reference `@mvp-brief.md` and `@build-spec.md` for context. Today I need to:
> 1. Write a Supabase SQL migration creating these 11 tables: users, friends, memory_notes, voice_notes, shared_interests, rituals, interactions, held_relationships, held_events, today_spotlights, reflection_barriers. Use the schema in @build-spec.md section 1 exactly.
> 2. Add RLS policies scoped to `auth.uid()` for each table.
> 3. Build a React component library in `/components/brand/` with: BrandBar, BrandMark (using the Overlap SVG with two circles + mustard intersection), Eyebrow, Headline, Subhead, PrimaryButton, SecondaryButton, TextLink. Use the design specs in @build-spec.md section 8.
> 4. Create a `/dev` route that showcases each component with sample text.
> Stack: Next.js 15 App Router, TypeScript, Tailwind v3.

**End-of-day check:** All 11 tables visible in Supabase dashboard. `/dev` route shows all brand components rendering correctly.

---

### DAY 3 — Tuesday, May 19

**Goal:** Auth flow working. Onboarding screens 1, 2 built.

**Tasks:**
1. Set up Supabase Auth with magic links + Google sign-in
2. Build `/signin` page and `/auth/callback` route
3. Build Screen 1 (Welcome) at `/`
4. Build Screen 2 (Reflection intro) at `/onboarding`
5. Implement a simple onboarding state machine (React Context or Zustand) to hold reflection answers across steps

**Cursor prompt:**
> Using `@build-spec.md`, set up Supabase Auth in this Next.js app. Configure magic link email + Google OAuth. Create:
> 1. `/signin` page with email input + Google button (Screen 9 design from prior mockups)
> 2. `/auth/callback` route to handle the magic link redirect
> 3. `/` (Welcome — Screen 1): brand mark + KinMatch wordmark + "Friendship, on rhythm." tagline + "Stay close to the people who matter most." subhead + Get Started button → navigates to `/onboarding`
> 4. `/onboarding` (Reflection intro — Screen 2): "Before we begin" eyebrow, "A small reflection, first." headline, three numbered steps explaining Q1/Q2/Q3, "Begin reflection" button → navigates to `/onboarding/q1`
> 5. Onboarding state via React Context: `{ q1Names, q2Names, q3Barriers, watchers }` — persists in sessionStorage so refresh doesn't lose data
> All copy matches the design mockups. Style with brand tokens. Mobile-first, max-width 480px centered.

**End-of-day check:** Can sign in via magic link. Welcome and reflection intro screens render correctly.

---

### DAY 4 — Wednesday, May 20

**Goal:** Reflection Q1, Q2, Q3 screens complete.

**Tasks:**
1. Build Screen 3 (Reflection Q1) at `/onboarding/q1`
2. Build Screen 4 (Reflection Q2) at `/onboarding/q2`
3. Build Screen 5 (Reflection Q3) at `/onboarding/q3`
4. Build the `<NameChip>` and `<AddNameInput>` components
5. Build `<ProgressDots>` component
6. Persist user input to React Context as they progress

**Cursor prompt:**
> Build three onboarding screens for KinMatch using brand components:
> 1. `/onboarding/q1` (Screen 3 — current tribe): ProgressDots(1/3) at top, "your tribe so far · N" eyebrow, NameChipList of added names with mini avatars + remove x, AddNameInput with italic placeholder "Add another name…", hint "5 to 10 people is a good start", dark ink Continue button.
> 2. `/onboarding/q2` (Screen 4 — wished closer): ProgressDots(2/3), pre-fill names from Q1 in the list (user can also add new), placeholder "Someone you've been thinking about…", hint "Long-distance and drifting friends welcome here." Subhead: "Even people you rarely see. These are who we'll help you stay close to."
> 3. `/onboarding/q3` (Screen 5 — barriers): ProgressDots(3/3), 6 pill buttons (multi-select): "I forget to follow up", "Distance or location", "Too busy / scheduling", "Awkward / haven't talked in a while", "Not sure how to deepen it", "It feels one-sided". Continue button switches to terracotta: "See my tribe →" → navigates to `/onboarding/reveal`.
> Use sessionStorage to persist state. Each chip gets a random brand avatar color assigned at add time (t, t2, f, m, g). Reference the existing mockup screens for exact layout.

**End-of-day check:** Can walk through Q1 → Q2 → Q3, add names, select barriers, all data persists across navigation.

---

### DAY 5 — Thursday, May 21

**Goal:** Tribe reveal + Held setup screens. End-of-onboarding wiring.

**Tasks:**
1. Build Screen 6 (Tribe reveal) at `/onboarding/reveal`
2. Build the `<ConstellationView>` component (pentagon layout for 5 faces; flexible for 4 or 6+)
3. Build Screen 7 (Held setup) at `/onboarding/held`
4. Build Screen 8 (Email preferences) at `/onboarding/email-prefs`
5. Wire the "complete onboarding" flow: when user finishes, fire `POST /api/onboarding/complete` which bulk-inserts friends, held_relationships, sets `users.onboarding_completed_at`

**Cursor prompt:**
> Build three more onboarding screens and the completion logic:
> 1. `/onboarding/reveal` (Screen 6 — Tribe reveal): "Reflection complete," eyebrow, "Here's your tribe." headline, "Five people you've chosen to invest in." italic subhead. ConstellationView in pentagon layout showing 5 face avatars in fixed positions. Continue button → `/onboarding/held`.
> 2. ConstellationView component: accepts `faces` array of `{name, avatarColor}`, positions them in pentagon (top center, two middle, two bottom). Has a `selectable` prop and `heartBadge` prop for Held screen variant.
> 3. `/onboarding/held` (Screen 7): "One last thing" eyebrow, "Choose who holds you." headline, italic subhead about 10-day quiet notification. Same constellation view but with tap-to-select; selected faces get a terracotta heart badge. Counter italic: "X selected · pick 1 or 2". Continue button (terracotta) + "Set up Held later" deferral link.
> 4. `/onboarding/email-prefs` (Screen 8): "Almost done" eyebrow, "We'll email you, not interrupt you." headline, sample inline email card with KinMatch icon + "Sarah's been quiet for 18 days" sample. Single button "Sounds good →".
> 5. After email-prefs, the flow proceeds to magic-link auth at `/signin` (already built).
> 6. Build `/api/onboarding/complete` endpoint: takes the entire onboarding state from request body, creates user record (already done via auth), bulk-inserts friends with `wished_closer` flag from Q2, creates held_relationships rows for the selected watchers, inserts reflection_barriers rows.

**End-of-day check:** Can complete onboarding end-to-end. Database shows real friends/held_relationships rows. Onboarding_completed_at timestamp set.

---

### DAY 6 — Friday, May 22

**Goal:** Today screen working. Person Profile working with read-only memory.

**Tasks:**
1. Build Screen 10 (Today) at `/today`
2. Build `<SpotlightCard>` component
3. Build `<TribeList>` and `<DriftIndicator>` components
4. Build `<BottomNav>` component
5. For pilot, populate `today_spotlights` manually via Supabase SQL editor — pick whichever tribe member has the highest days_quiet and write a templated prompt
6. Begin Screen 11 (Person Profile) at `/friends/[id]`

**Cursor prompt:**
> Build the Today home screen for authenticated users at `/today`. It should:
> 1. Check auth — if user not logged in, redirect to `/signin`
> 2. If user has not completed onboarding, redirect to `/onboarding`
> 3. Fetch from `/api/today` which returns `{ spotlight, tribe }`
> 4. Render: BrandBar at top, eyebrow showing current day (e.g., "Tuesday morning"), Headline "Who needs you today", SpotlightCard with friend avatar + name + days quiet + italic prompt + terracotta "Send voice note" button, then "your tribe · N people" eyebrow, then TribeList of all friends with mini avatars + names + days quiet (terracotta-deep color if drifting past cadence).
> 5. BottomNav at bottom: Home (active), Users (Tribe), Microphone (Voice notes), Heart-handshake (Held).
> 6. Build `/api/today` endpoint: fetches user's most recent today_spotlights row for today's date OR falls back to picking the friend with highest days_quiet. Returns spotlight object + ordered tribe list.
> 7. SpotlightCard component: cream-deep background, rounded 16px, friend avatar + name + status, italic prompt text, terracotta voice-note button at bottom. Tap CTA → navigates to `/friends/[id]/voice-note`.

**End-of-day check:** After completing onboarding, lands on `/today` showing real spotlight + tribe. Drift indicators show.

---

### DAY 7 — Saturday, May 23 (weekend — half day)

**Goal:** Person Profile fully built. Memory layer displayed.

**Tasks:**
1. Finish Screen 11 (Person Profile) at `/friends/[id]`
2. Build `/api/friends/[id]` endpoint with includes (memories, rituals, shared_interests, interactions)
3. Build all the profile sub-components: SuggestedNextStepCard, ActionRow, MemorySection, InterestPills, RitualList, RecentInteractionsList
4. Build the "+" tap target on Memory Section that opens a modal for adding a note

**Cursor prompt:**
> Build the Person Profile screen at `/friends/[id]`:
> 1. Fetch `/api/friends/[id]` which returns full friend object with all related records.
> 2. Layout per the mockup: BrandBar + back button + "..." menu, Hero (avatar + name + italic friendship vibe in terracotta + "Biweekly · X days quiet" status line), SuggestedNextStepCard with italic prompt and terracotta voice-note button, ActionRow (3 outlined small buttons: text/call/plan), "things to remember" eyebrow with "+" icon and bullet list of memory notes (italic), "shared interests" eyebrow with pill chips, "rituals" eyebrow with streak counts, "recent" eyebrow with last 3 interactions, BottomNav.
> 3. Build `/api/friends/[id]` endpoint: returns friend + memories + interests + rituals + last 5 interactions.
> 4. The "+" icon on the memory section is a button that opens a modal (Screen 12 — Memory Capture).

**End-of-day check:** Can tap a friend on Today → see their full profile with all related data.

---

### DAY 8 — Sunday, May 24 (weekend — half day)

**Goal:** Memory capture modal works. Can add a memory note manually.

**Tasks:**
1. Build Screen 12 (Memory capture modal)
2. Build `POST /api/friends/[id]/memories` endpoint
3. Test the full loop: tap "+" on profile → modal opens → type a note → save → returns to profile → note appears in the list

**Cursor prompt:**
> Build a Memory Capture modal component that opens over the Person Profile when the user taps "+" on the memory section:
> 1. Modal layout per Screen 12 mockup: BrandBar at top + back button, friend reference (small avatar + "a note about [name]"), "What's worth remembering?" headline, italic subhead "Anything small or specific. KinMatch will surface it at the right moment.", large textarea styled as a notebook (cream-deep border, generous padding, italic text), small microphone icon in bottom-right corner of textarea (placeholder — wire up Web Speech API in Day 9), italic helper "Tap the mic to add notes by voice instead", terracotta "Save to [Name]'s notes" button at bottom, underlined Cancel link.
> 2. On save: POST to `/api/friends/[id]/memories` with `{ text }`. Endpoint inserts into memory_notes table with `source: 'manual'`. Returns the new note.
> 3. After save, close modal, refresh profile data, show new note in the list with a brief fade-in.
> 4. Cancel just closes the modal, no save.

**End-of-day check:** Can add a memory note from the profile. Note persists in database. Reappears on refresh.

---

### DAY 9 — Monday, May 25

**Goal:** Voice note recording works. Can record audio, upload to Vercel Blob, send.

**Tasks:**
1. Set up Vercel Blob storage (`npm install @vercel/blob`)
2. Build the voice recording screen at `/friends/[id]/voice-note`
3. Implement MediaRecorder API for audio capture
4. Build upload endpoint `/api/voice-notes` that returns signed upload URL
5. Build `/api/voice-notes/[id]/finalize` to confirm upload
6. Build `/api/voice-notes/[id]/send` to fire Klaviyo event

**Cursor prompt:**
> Build the voice note recording screen at `/friends/[id]/voice-note`:
> 1. Layout: BrandBar + back button, friend reference at top (avatar + name), centered big terracotta recording button (~120px diameter), live duration timer below, italic helper text "Hold to speak" → when recording: "Recording... release to stop", live waveform visualization during recording (use Web Audio API analyser node), max duration 90 seconds with auto-stop, send button (terracotta, only enabled after recording exists).
> 2. Use MediaRecorder API. On user press-and-hold the button, start recording. Display live waveform. On release (or 90s timeout), stop recording. Show duration.
> 3. On Send tap: call `POST /api/voice-notes` to create record + get signed upload URL → upload audio blob to Vercel Blob → call `POST /api/voice-notes/[id]/finalize` with `{ duration, peaks }` (compute 30 waveform peaks for display) → call `POST /api/voice-notes/[id]/send` which fires Klaviyo "voice_note_received" event with share_token URL.
> 4. After send: navigate back to friend's profile with a small toast "Voice note sent to [Name]" (this is the only place we use a toast — confirmation feedback).
> 5. Set up @vercel/blob in `/api/voice-notes` route handler. Generate unique share_token (use nanoid or crypto.randomUUID).

**End-of-day check:** Can record a voice note, see waveform, send it. Voice note exists in database with audio URL.

---

### DAY 10 — Tuesday, May 26

**Goal:** Public voice note listening page works. Recipient gets email and can listen.

**Tasks:**
1. Build the public listening page at `/v/[share_token]`
2. Build `GET /api/v/[share_token]` (public, no auth)
3. Set up Klaviyo account if not already done
4. Create the "Voice note received" email template in Klaviyo
5. Test the full loop: record → send → email arrives at friend's email → click link → listen on web

**Cursor prompt:**
> Build the public voice note listening page at `/v/[share_token]`:
> 1. This page is publicly accessible — no auth required.
> 2. Layout per Screen 13 (public variant): BrandBar small at top, large avatar of sender (with their assigned color), sender's name, italic "sent a voice note · [date]", AudioPlayer component with HTML5 audio element + custom waveform SVG using peaks from DB + 46px terracotta play button + duration timestamps, transcript card below (only show if transcript exists, otherwise hide), no in-app actions (no "Reply with voice" — public viewers aren't users), instead a footer CTA: "This was sent through KinMatch. Stay close to the people who matter — [Get KinMatch free →]" linking to /signup.
> 3. Build `GET /api/v/[share_token]`: returns `{ sender_name, sender_avatar_color, audio_url (signed URL from Vercel Blob), duration, peaks, transcript? }`. No auth required. Rate limit by IP if you want (optional).
> 4. AudioPlayer component: takes `audioUrl, peaks, duration` props. Renders 30 waveform bars with played bars in solid terracotta, unplayed at 35% opacity. Play button toggles play/pause. Update bars in real-time as audio plays. Below waveform: current time / total time in monospace small text.
> 5. Set up Klaviyo: create the "Voice Note Received" flow triggered by event `kinmatch_voice_note_received`. Template: subject "[Sender] sent you a voice note", body includes a play button linking to the share_token URL, brand-consistent design.

**End-of-day check:** Can record a voice note, recipient gets the email, taps link, lands on a working web player and can listen.

---

### DAY 11 — Wednesday, May 27

**Goal:** SMS/WhatsApp memory ingestion via paste works. Claude extraction.

**Tasks:**
1. Get Anthropic API key, install SDK: `npm install @anthropic-ai/sdk`
2. Build the "Capture from a conversation" surface (paste-based)
3. Build `POST /api/extract-memories` endpoint that calls Claude
4. Wire up the manual entry path in the memory capture modal (already built — just add a "Paste a conversation" toggle)
5. Test: copy a real iMessage thread → paste → see extracted memory candidates → save

**Cursor prompt:**
> Add SMS/WhatsApp message ingestion to the memory capture flow.
>
> Background: users want to paste a conversation (from iMessage, WhatsApp, or anywhere) into KinMatch and have it extract memorable facts about a friend. This is the paste-based version — the simplest implementation that works on every device.
>
> 1. Enhance the existing Memory Capture modal (Screen 12) with a tab toggle at the top: "Write a note" (default, existing behavior) | "Paste a conversation" (new).
> 2. When "Paste a conversation" tab is active: show a larger textarea with italic placeholder "Paste a text thread, WhatsApp message, or any conversation here. KinMatch will pull out what's worth remembering.", show a "Extract memories" button (terracotta) below it instead of "Save".
> 3. On Extract tap: POST to `/api/extract-memories` with `{ friend_id, conversation_text }`. Endpoint calls Claude API with this prompt:
>
> ```
> You are extracting distinct memorable facts from a conversation a user had with their friend [friend.name].
> Focus on facts worth remembering long-term: health updates, family milestones, work changes, personal interests, life transitions, plans, emotional state.
> Avoid: small talk, greetings, logistics, generic platitudes.
> Existing memory notes about this friend (avoid duplicates): [list]
> Return a JSON array of up to 3 objects: { text: string, tag: 'health'|'family'|'work'|'milestone'|'interest'|'other', event_date?: 'YYYY-MM-DD' }
> Conversation:
> [pasted text]
> ```
>
> 4. Display returned candidates as tappable cards (multi-select). User taps to add some/all → "Save selected" button → bulk POST to `/api/friends/[id]/memories`.
> 5. Model: `claude-sonnet-4-5`. Use response_format JSON. Cache nothing — extraction runs fresh each time.
>
> Use the Anthropic TypeScript SDK. Add ANTHROPIC_API_KEY to environment variables.
>
> Reference: this is a v1 of memory ingestion. v1.1 will add PWA share-sheet target so users can share directly from iMessage. v2 will explore Twilio number forwarding and WhatsApp Business API integration.

**End-of-day check:** Can paste a real conversation, see Claude-extracted memory candidates, save them to a friend's profile.

---

### DAY 12 — Thursday, May 28

**Goal:** Held tab built. Onboarding works for new users end-to-end.

**Tasks:**
1. Build Screen 16 (Held tab) at `/held`
2. Build `GET /api/held` endpoint
3. Wire up onboarding's Held setup so configured watchers actually persist
4. Run full end-to-end test: new user signs up → reflection → tribe reveal → Held setup → email prefs → account creation → lands on Today → can browse profile → can add memory → can record voice note → can paste a message → can view Held tab

**Cursor prompt:**
> Build the Held tab at `/held`:
> 1. Layout per Screen 16 mockup: BrandBar, "Held" headline, italic subhead "A quiet circle of care. You hold X · X hold you.", "You're holding" eyebrow + list of friends the user holds (each row: avatar + name + status — "Xd quiet · at threshold" or "Xd quiet · alerts at Yd"). For pilot, "holding" relationships are friends the user added to their Held circle during onboarding (these are people THEY watch, which technically maps to held_user being a friend not a user — clarify in implementation). "Held by" eyebrow + list of friends watching the user (with heart icons). "Recent" eyebrow + 1-2 historical event cards (for pilot, these can be mocked or empty). Underlined "Pause or adjust thresholds" link at bottom. BottomNav.
> 2. Build `GET /api/held`: returns `{ holding, held_by, recent_events }`. For pilot, "recent_events" can return empty array (Held alerts not yet automated).
> 3. For pilot purposes, the original "watchers" selected during onboarding (Screen 7) map to held_relationships where holder_user_id is the current user and held_friend_id is the friend (since the friend doesn't have an account). This represents "I'm watching this friend." Document this in code with a comment for future v1.1 reciprocal mapping.

**End-of-day check:** Full end-to-end flow works. Held tab renders with real data from onboarding.

---

### DAY 13 — Friday, May 29

**Goal:** Polish day. Fix bugs found in testing. Improve UX rough edges.

**Tasks:**
1. Self-test the entire flow 3 times on different devices (iPhone Safari, Android Chrome, desktop)
2. Fix the top 5–10 bugs you find
3. Set up basic analytics: PostHog or Plausible (~30 min to install)
4. Improve loading states — replace any spinners with skeleton cards
5. Test on iPhone Safari specifically — Web Audio API can be finicky
6. Make sure all email-collection points (waitlist signup, friend email entry during Add Connection) work properly

**Cursor prompt:**
> Audit the entire KinMatch pilot app for the following issues and fix any you find:
> 1. Loading states: replace any spinners with skeleton card components matching the brand. Skeleton color: cream-deep with subtle shimmer.
> 2. Empty states: every list that could be empty should have warm copy. Empty tribe: "Add your first connection to begin." Empty memory list on profile: "Add a note about [name] — anything small or specific." Empty Held: "You haven't set up Held yet. Configure who holds you →".
> 3. Error handling: every fetch call wrapped in try/catch with user-facing error message "Couldn't reach KinMatch. Try again in a moment." — no scary red banners, just italic inline text.
> 4. Mobile Safari: test voice recording specifically on iOS Safari (MediaRecorder works but requires user gesture and HTTPS). Confirm playback works on the public listening page on iOS.
> 5. Auth redirect loops: confirm that signed-in users on `/onboarding` don't get sent back to `/signin`, and that users who've completed onboarding don't get sent back to `/onboarding`.
> 6. Form validation: name input on Q1 should require 3+ characters; barriers in Q3 should require at least 1 selection.
> 7. Add basic PostHog or Plausible analytics. Track: onboarding_started, onboarding_completed, voice_note_sent, memory_added, capture_from_paste_used.

**End-of-day check:** Have completed the full user flow on three different devices without errors. Analytics tracking events.

---

### DAY 14 — Saturday, May 30 + Sunday, May 31

**Goal:** Deploy. Onboard pilot users.

**Saturday (May 30):**
1. Final QA pass — run through the flow as if you were a new user, no exceptions
2. Deploy to production at `kinmatch.app` (or `app.kinmatch.co` subdomain)
3. Confirm Klaviyo flows are in production mode
4. Write a brief onboarding email to send to pilot users — what to expect, how to give feedback
5. Pick 5–10 waitlist users to invite (your most engaged ones)

**Sunday (May 31):**
1. Send the pilot invitation emails
2. Be available all day for support / hand-holding
3. Monitor analytics + Klaviyo for failures
4. Take notes on every issue users report

**Cursor prompt:**
> Help me write a pilot invitation email for KinMatch. It should go out to 5-10 waitlist users on May 31. Tone: warm, intentional, slightly conspiratorial ("you're early — help me shape this").
>
> Content elements:
> - Thanks for joining the waitlist
> - You're one of the first 10 to use KinMatch
> - Quick description of what it is (voice-first, helps you stay close to your tribe)
> - Link to onboard at app.kinmatch.co
> - Honest acknowledgment: this is an early pilot, expect rough edges, but the core works
> - Direct ask for feedback: reply to this email with anything you notice, love, or struggle with
> - Sign-off from Yewande personally

**End-of-day check (May 31):** 5-10 users have completed onboarding. At least 2 voice notes have been sent. At least 5 memory notes have been captured.

---

## Cost ceiling for the 14 days

- **Vercel:** Free (Hobby plan covers this)
- **Supabase:** Free (free tier handles pilot easily)
- **Klaviyo:** Free under 250 contacts
- **Anthropic API:** ~$5 in extraction calls during build/pilot (Sonnet 4.5 is cheap at this volume)
- **Vercel Blob:** Free under 1GB (you'll be well under this)
- **Domain:** Already own kinmatch.co
- **Total external cost:** ~$5

You're not paying for anything material until you have meaningful traction. That's the right shape for a 14-day build.

---

## The SMS/WhatsApp memory ingestion roadmap

**v1 (this 14-day build):** Paste-based capture. Works on every device. Zero integration. User copies a thread from iMessage/WhatsApp, pastes into KinMatch, taps extract.

**v1.1 (4 weeks post-pilot):** Native share-sheet integration via PWA share target API. When user shares a message from iMessage or WhatsApp on a supported device, KinMatch appears as a share destination. The message gets ingested without needing to navigate to the app.

**v1.2 (8 weeks post-pilot):** Apple Shortcuts integration for power users. Create a shareable Shortcut: "Save to KinMatch" that routes selected text + sender name to KinMatch's API.

**v2 (post-validation):** Twilio number forwarding. User gets a unique KinMatch SMS number (+1-xxx-xxx-xxxx). They can forward any iMessage/SMS/WhatsApp message to that number. KinMatch identifies the original sender (via stored phone number on friend records), extracts memories, saves them. Same flow for inbound messages a friend sends *to* the user — they can forward those too.

**v2+ (much later):** WhatsApp Business API integration. KinMatch becomes a WhatsApp Business account. Users can chat with KinMatch via WhatsApp itself. The chatbot can extract memories from forwarded messages, query memory history, suggest next actions.

The paste-based v1 captures 80% of the value with 5% of the complexity. Ship that. Validate that users actually use it. Then invest in the integrations.

---

## What you can NOT achieve in 14 days

To be explicit about scope reductions you're accepting:

- **No automated daily spotlight engine.** For the pilot, you'll manually curate or use a simple "highest days_quiet" rule. The full trigger taxonomy (8 categories, priority engine) is v1.1 work.
- **No automated Held alerts.** The Held tab will exist and show config, but the cron job that fires alerts is v1.1.
- **No Sunday Voice Drop emails.** Defer the ritual entirely. Users will discover the weekly rhythm through usage, not nudges.
- **No voice note transcription.** Voice notes play; no AI transcription yet. Add Whisper in v1.1.
- **No automated memory extraction from sent voice notes.** Only manual capture + paste-based capture in pilot. Auto-extraction from outbound voice notes (Screen 14) is v1.1.
- **No AI suggestion layer intelligence.** Screen 17 can be a static menu for pilot. Per-friend context-aware ordering is v1.1.
- **No voice notes inbox screen.** Just show recent voice notes inline on each friend's profile. Dedicated inbox screen is v1.1.

These deferrals let you ship a working pilot in 14 days. The core wedge — voice notes + memory layer + tribe — is intact. Everything else can wait until pilot feedback tells you what to invest in next.

---

## What to watch for during the pilot

After May 31, instrument these signals over the first 7 days of pilot use:

1. **Onboarding completion rate.** How many users who start finish? Below 50% means the reflection feels too heavy.
2. **First voice note timing.** How long after onboarding until the first voice note is sent? Same-day = strong signal. >3 days = signal that the spotlight isn't pulling people in.
3. **Memory notes per user per week.** This is the key activation metric. Users who type 3+ memories in week 1 will retain. Users with 0 memories in week 1 will churn.
4. **Voice note listen-through rate.** What % of voice notes sent are actually listened to? Signals whether the open-distribution model is working.
5. **Paste-based capture usage.** How often do users paste a conversation vs. type a memory directly? Tells you whether the SMS/WhatsApp ingestion idea has legs.
6. **Verbal feedback.** Get on the phone with at least 3 pilot users in the first week. Quantitative signals tell you what's happening; conversations tell you why.

If usage is strong, double down on the wedge and start building v1.1. If usage is weak, the conversation data will tell you what to change before investing more dev time.

---

*Ship something this Friday. Get it in front of real users by next Sunday. The plan after that depends on what they show you.*
