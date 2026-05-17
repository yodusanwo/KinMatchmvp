# KinMatch — Wireframe-to-Build Mapping

*The technical bridge between the 18 designed screens and the running v1 MVP.*

---

## Stack assumptions

- **Framework:** Next.js 15 (App Router) on Vercel
- **Database & Auth:** Supabase (Postgres + Auth with RLS) — alternative: Clerk for auth if you prefer
- **Language:** TypeScript with Zod for validation
- **Styling:** Tailwind CSS with KinMatch brand tokens as CSS variables
- **Icons:** Tabler Icons (per design system)
- **Audio storage:** Vercel Blob
- **Email:** Klaviyo (event-triggered transactional + flows)
- **Transcription:** OpenAI Whisper API
- **AI memory extraction:** Anthropic Claude API (model: `claude-sonnet-4-5`)
- **Cron jobs:** Vercel Cron or Supabase Edge Functions

---

## 1. Data Model

Eleven Postgres tables. All have `created_at timestamptz default now()` and Row-Level Security policies scoped to the authenticated user.

### `users`
```
id                        uuid (PK, default auth.uid())
email                     text unique
name                      text
timezone                  text default 'America/Chicago'
onboarding_completed_at   timestamptz nullable
email_preferences         jsonb default '{
                            "daily_checkin": true,
                            "sunday_voice_drop": true,
                            "held_alerts": true
                          }'
```

### `friends` (Connections in user-facing language)
```
id                  uuid (PK)
user_id             uuid → users.id
name                text
avatar_color        text — 't' | 't2' | 'f' | 'm' | 'g' (brand palette code)
vibe                text — 'potential_close' | 'activity' | 'professional' | 'community'
where_met           text nullable
met_at              date nullable
birthday            date nullable
cadence_days        int default 14
last_touch_at       timestamptz
is_wished_closer    bool default false — from reflection Q2
in_tribe            bool default true
archived_at         timestamptz nullable
```

### `memory_notes`
```
id                  uuid (PK)
friend_id           uuid → friends.id
text                text
event_date          date nullable — for time-sensitive memories (chemo Oct 10)
tag                 text — 'health' | 'family' | 'work' | 'milestone' | 'interest' | 'other'
source              text — 'manual' | 'voice_extraction' | 'add_connection'
last_surfaced_at    timestamptz nullable
```

### `voice_notes`
```
id                      uuid (PK)
sender_user_id          uuid → users.id
recipient_friend_id     uuid → friends.id nullable
recipient_user_id       uuid → users.id nullable — if recipient has KinMatch
audio_url               text — Vercel Blob URL
duration_seconds        int
waveform_peaks          jsonb — pre-computed array of 30 peak heights for display
transcript              text nullable
listened_at             timestamptz nullable
share_token             text unique — for public web link distribution
```

### `shared_interests`
```
id          uuid (PK)
friend_id   uuid → friends.id
label       text — "Pottery", "Lake Michigan"
```

### `rituals`
```
id                  uuid (PK)
friend_id           uuid → friends.id
label               text — "First Saturday brunch"
cadence             text — 'weekly' | 'biweekly' | 'monthly'
streak_count        int default 0
last_occurred_at    date nullable
```

### `interactions`
```
id                  uuid (PK)
user_id             uuid → users.id
friend_id           uuid → friends.id
type                text — 'voice_note_sent' | 'voice_note_received' | 'call' | 'in_person' | 'text'
voice_note_id       uuid → voice_notes.id nullable
duration_minutes    int nullable
location            text nullable
notes               text nullable
occurred_at         timestamptz
```

### `held_relationships`
```
id                  uuid (PK)
holder_user_id      uuid → users.id — who watches
held_user_id        uuid → users.id nullable — if held person has KinMatch
held_friend_id      uuid → friends.id nullable — if held person is just a friend
threshold_days      int default 10
status              text — 'active' | 'paused'
last_alert_fired_at timestamptz nullable
```

### `held_events`
```
id                          uuid (PK)
held_relationship_id        uuid → held_relationships.id
event_type                  text — 'alert_fired' | 'response_received' | 'paused' | 'threshold_changed'
response_voice_note_id      uuid → voice_notes.id nullable
occurred_at                 timestamptz
```

### `today_spotlights` (daily computed cache)
```
id                  uuid (PK)
user_id             uuid → users.id
friend_id           uuid → friends.id
trigger_type        text — 'drift' | 'birthday' | 'memory_event' | 'reciprocity' | 'held' | 'approaching'
priority_score      int
prompt_text         text — the italic context line ("Her chemo session was Thursday...")
suggested_action    text — 'voice_note' | 'text' | 'call' | 'plan'
generated_for_date  date
UNIQUE              (user_id, generated_for_date)
```

### `reflection_barriers` (Q3 onboarding answers — small but useful for segmentation)
```
id          uuid (PK)
user_id     uuid → users.id
barrier     text — 'i_forget' | 'distance' | 'busy' | 'awkward' | 'unsure_how' | 'one_sided'
```

---

## 2. API Endpoints

All under `/api/`. Authenticated via Supabase JWT or Clerk session except where noted.

### Auth
- `POST /api/auth/magic-link` — request magic link email (delegates to Supabase Auth)
- `GET /api/auth/callback` — handle redirect after click
- `POST /api/auth/google` — Google OAuth
- `POST /api/auth/signout`

### Onboarding
- `POST /api/onboarding/reflection` — body: `{ q1_names[], q2_names[], q3_barriers[] }` → bulk-creates friends, sets wished_closer flag from Q2, stores barriers
- `POST /api/onboarding/held-setup` — body: `{ watcher_friend_ids[] }` → creates `held_relationships` rows
- `POST /api/onboarding/complete` — sets `onboarding_completed_at`

### Friends
- `GET /api/friends` — list all friends with light meta (name, avatar_color, days_quiet, last_touch_at)
- `POST /api/friends` — add a new connection
- `GET /api/friends/:id` — full friend with includes (memories, rituals, interests, recent_interactions[10], suggested_next_step)
- `PATCH /api/friends/:id` — update fields
- `DELETE /api/friends/:id` — archive (soft delete via archived_at)

### Memory Notes
- `POST /api/friends/:id/memories` — add note (body: `{ text, tag?, event_date? }`)
- `PATCH /api/memories/:id` — edit
- `DELETE /api/memories/:id`

### Voice Notes
- `POST /api/voice-notes` — create record + signed upload URL for Vercel Blob
- `POST /api/voice-notes/:id/finalize` — confirm upload complete, set duration + waveform_peaks
- `POST /api/voice-notes/:id/send` — fire Klaviyo event to recipient (email with share_token URL)
- `GET /api/voice-notes` — inbox list, grouped by time bands
- `GET /api/voice-notes/:id` — single voice note (authenticated)
- `GET /api/v/:share_token` — **public** listening page data (no auth) — returns `{ sender_name, sender_avatar_color, audio_url, duration, transcript? }`
- `PATCH /api/voice-notes/:id/listened` — mark as listened
- `POST /api/voice-notes/:id/transcribe` — queue Whisper transcription
- `POST /api/voice-notes/:id/extract-memories` — Claude API call to extract candidates; returns suggested memory notes

### Held
- `GET /api/held` — returns `{ holding[], held_by[], recent_events[] }`
- `POST /api/held` — add a watcher
- `PATCH /api/held/:id` — change threshold or pause
- `DELETE /api/held/:id`

### Today
- `GET /api/today` — returns `{ spotlight, tribe[] }`
- `POST /api/today/dismiss` — mark current spotlight as dismissed, fetch next-ranked candidate

### Webhooks (inbound)
- `POST /api/webhooks/klaviyo` — for tracking email opens/clicks (optional)

---

## 3. Cron Jobs

### Daily spotlight computation
- **Schedule:** Daily at 6am UTC (per-user-timezone offset handled in code)
- **Logic:** For each active user, compute triggers across their tribe, score each, pick highest priority, generate prompt text (template or Claude API), write to `today_spotlights`
- **Triggers checked in v1:**
  - Drift past cadence_days
  - Approaching threshold (80% of cadence)
  - Birthday today / tomorrow
  - Memory note with `event_date` within last 14 days (high emotional weight)
- **Side effect:** Fires Klaviyo `daily_checkin` event 4 hours later (10am user-local) if user has email enabled

### Held alert check
- **Schedule:** Every 6 hours
- **Logic:** For each `held_relationships` row with status='active', check if `held_user_id`'s `last_touch_at` is beyond `threshold_days`. If yes AND no alert fired in last 7 days, fire alert
- **Side effect:** Fires Klaviyo `held_alert` event to the holder; inserts `held_events` row

### Sunday Voice Drop
- **Schedule:** Sundays 4pm user-local (job split into 24 hourly batches by timezone)
- **Logic:** For each active user with `sunday_voice_drop=true`, pick top 3 quiet candidates from tribe, write to a `sunday_drop_candidates` ephemeral table or fire Klaviyo event with token data directly
- **Side effect:** Fires Klaviyo `sunday_voice_drop` event

### Voice note delivery (event-triggered, not scheduled)
- **Trigger:** `POST /api/voice-notes/:id/send` completes
- **Logic:** Fires Klaviyo `voice_note_received` event with `share_token` URL embedded
- **Recipient:** Friend's email (collected during Add Connection)

---

## 4. Per-Screen Mapping

For each of the 18 screens: data dependencies, API calls, components, key interactions.

### Screen 1: Welcome
- **Reads:** None (logged-out)
- **Writes:** None
- **Components:** `<BrandMark>`, `<Wordmark>`, `<Headline>`, `<Subhead>`, `<PrimaryButton>`, `<TextLink href="/signin">`
- **Notes:** Static; CTA navigates to `/onboarding/reflection-intro`

### Screen 2: Reflection intro
- **Reads:** None
- **Writes:** None
- **Components:** `<BrandBar>`, `<Eyebrow>`, `<Headline>`, `<NumberedSteps>` (3 with terracotta/forest/mustard circles), `<PrimaryButton>`
- **Notes:** Pure layout; "Begin reflection" → `/onboarding/q1`

### Screen 3: Reflection Q1 (current tribe)
- **Reads:** Local form state
- **Writes:** Local form state (names added to in-memory array)
- **API calls:** None yet (deferred until completion)
- **Components:** `<BrandBar>`, `<ProgressDots filled={1} total={3}>`, `<Headline>`, `<NameChipList items={names} mini-avatars />`, `<AddNameInput onAdd={...}>`, `<ContinueButton>`
- **Notes:** Each chip gets a random brand avatar color on add; names persist only when onboarding finalizes

### Screen 4: Reflection Q2 (wished-closer)
- **Reads:** Local state
- **Writes:** Local state with `wished_closer: true` flag
- **Components:** Same as Q1 with different copy
- **Notes:** Pre-fills names from Q1 in the "priority list" — user can also add new names

### Screen 5: Reflection Q3 (barriers)
- **Reads:** Local state
- **Writes:** Local state with selected barriers
- **Components:** `<BrandBar>`, `<ProgressDots filled={3} total={3}>`, `<Headline>`, `<PillButtonGroup multi-select options={[6 barriers]}>`, `<PrimaryButton>` (now terracotta — brand-defining moment)
- **Notes:** Multi-select; at least one required; "See my tribe →" finalizes Q1+Q2+Q3 state

### Screen 6: Tribe reveal
- **Reads:** Local state (5 names with colors)
- **Writes:** None (yet — celebration screen)
- **Components:** `<BrandBar>`, `<Eyebrow>`, `<Headline>`, `<ConstellationView positions={pentagon} faces={5}>`, `<ContinueButton>`
- **Notes:** First "wow" moment. Faces in fixed pentagon positions; colors assigned during reflection

### Screen 7: Held setup
- **Reads:** Local state (the 5 tribe faces)
- **Writes:** Local state (which 1-2 are selected as watchers)
- **Components:** `<BrandBar>`, `<Headline>`, `<ConstellationView selectable heartBadge />`, `<Counter>`, `<PrimaryButton>`, `<TextLink>` (Set up Held later)
- **Notes:** Tap a face → toggle heart badge; max 2 selected; deferral path skips Held setup but completes onboarding

### Screen 8: Email preferences
- **Reads:** Default email_preferences
- **Writes:** None directly (confirmation only)
- **Components:** `<BrandBar>`, `<Headline>`, `<EmailPreviewCard>`, `<PrimaryButton>` ("Sounds good")
- **Notes:** Pure confirmation; defaults persist as-is

### Screen 9: Account creation
- **Reads:** Optional pre-filled email from waitlist (URL param or cookie)
- **Writes:** User record after auth confirmation
- **API calls:** `POST /api/auth/magic-link` or `POST /api/auth/google`; on success → `POST /api/onboarding/reflection` + `POST /api/onboarding/held-setup` + `POST /api/onboarding/complete`
- **Components:** `<BrandBar>`, `<Headline>`, `<EmailInput>`, `<PrimaryButton>`, `<Divider>`, `<GoogleSignInButton>`, `<TermsFooter>`
- **Notes:** Magic link flow: user enters email → check inbox → click → returns to `/today`

### Screen 10: Today (home, day 90)
- **Reads:** `GET /api/today` → `{ spotlight: TodaySpotlight, tribe: FriendSummary[] }`
- **Writes:** None
- **API calls:** GET on mount, refresh on window focus
- **Components:** `<BrandBar>`, `<Eyebrow>` (date), `<Headline>`, `<SpotlightCard>`, `<TribeList>` (with `<DriftIndicator>` per friend), `<BottomNav>` (Held badge if holding ≥1)
- **Notes:** Spotlight CTA → voice recording flow with friend pre-filled; tribe member tap → `/friends/:id`

### Screen 11: Person Profile
- **Reads:** `GET /api/friends/:id` with includes
- **Writes:** None directly
- **API calls:** GET on mount
- **Components:** `<BrandBar>`, `<BackButton>`, `<AvatarLarge>`, `<NameAndVibe>`, `<SuggestedNextStepCard>`, `<ActionRow>` (3 secondary actions), `<MemorySection editable>`, `<InterestPills>`, `<RitualList>`, `<RecentInteractionsList>`, `<BottomNav>`
- **Notes:** Tap `+` on memory section → `<MemoryCaptureModal>`; tap "Send voice note" → voice recording flow

### Screen 12: Memory capture modal
- **Reads:** Friend context (name, avatar)
- **Writes:** `POST /api/friends/:id/memories`
- **Components:** `<BrandBar>`, `<BackButton>`, `<FriendReference>`, `<Headline>`, `<TextArea>` (with embedded voice-input mic button using Web Speech API), `<SaveButton>`, `<CancelLink>`
- **Notes:** Voice input transcribes to text in-place; user can edit before save; auto-tags via simple keyword matching in v1 (chemo→health, etc.)

### Screen 13: Voice note received (listening view)
- **Reads:** `GET /api/voice-notes/:id` (authenticated) or `GET /api/v/:share_token` (public)
- **Writes:** `PATCH /api/voice-notes/:id/listened` on first play
- **API calls:** GET on mount; PATCH on play event; optional fetch of transcript
- **Components:** `<BrandBar>`, `<BackButton>`, `<AvatarXL>`, `<NameAndTimestamp>`, `<AudioPlayer>` (HTML5 audio + custom waveform SVG using waveform_peaks), `<TranscriptCard>`, `<PrimaryButton>` (Reply with voice), `<SecondaryButton>` (Add to notes)
- **Notes:** Public version omits "Add to notes" button and replaces BottomNav with KinMatch install footer CTA

### Screen 14: Post-send capture moment
- **Reads:** `POST /api/voice-notes/:id/extract-memories` → returns suggestion array
- **Writes:** `POST /api/friends/:id/memories` (bulk for selected)
- **API calls:** Extract on mount (already transcribed); POST on save
- **Components:** `<BrandBar>`, `<ConfirmationLine>` (✓ sent), `<Headline>`, `<SuggestionCards>` (multi-select, one pre-selected), `<WriteOwnLink>`, `<SaveButton>`, `<SkipLink>`
- **Notes:** If extraction fails or returns empty, show only "Write your own" path; never block the flow

### Screen 15: Voice notes inbox
- **Reads:** `GET /api/voice-notes` grouped by time bands
- **Writes:** None
- **Components:** `<BrandBar>`, `<PageHeader>` (with `<NewVoiceNoteButton>`), `<TimeBandSection title="Unlistened">`, `<TimeBandSection title="This week">`, `<TimeBandSection title="Earlier this month">`, `<VoiceNoteRow>` × N, `<BottomNav>` (microphone tab active)
- **Notes:** New button → friend picker → voice recording; each row tap → listening view

### Screen 16: Held tab steady state
- **Reads:** `GET /api/held` → `{ holding, held_by, recent_events }`
- **Writes:** None directly
- **Components:** `<BrandBar>`, `<Headline>`, `<SubheadCount>`, `<HoldingSection>` (with `<HoldingRow>` × N), `<HeldBySection>` (with `<HeldByRow>` × N, hearts), `<RecentActivitySection>` (with `<HeldEventCard>` × 1-2), `<AdjustLink>`, `<BottomNav>`
- **Notes:** "At threshold" status shown in terracotta on holding rows; adjust → settings modal for thresholds

### Screen 17: AI Suggestion Layer
- **Reads:** `GET /api/friends/:id` (for context-aware option ordering)
- **Writes:** None (delegates to sub-flow)
- **Components:** `<BrandBar>`, `<BackButton>`, `<FriendReference>`, `<Headline>`, `<OptionList>` (5 options with `<OptionCard>` — voice note `featured`)
- **Notes:** Each option → distinct next flow. v1: voice note built; others can deep-link to native iOS/Android Messages, Phone, Calendar apps with pre-filled context

### Screen 18: Voice recording flow (not yet mocked but defined)
- **Reads:** Friend context (name)
- **Writes:** `POST /api/voice-notes` (create record + upload URL) → upload to Vercel Blob → `POST /api/voice-notes/:id/finalize` → `POST /api/voice-notes/:id/send`
- **Background async after send:** `POST /api/voice-notes/:id/transcribe` then `POST /api/voice-notes/:id/extract-memories`
- **Components:** `<BrandBar>`, `<FriendReference>`, `<RecordingButton>` (hold-to-speak), `<LiveWaveform>`, `<Timer>`, `<SendButton>`, `<DiscardLink>`
- **Notes:** MediaRecorder API; max duration 90 seconds; on send → navigate to PostSendCapture (screen 14)

---

## 5. Klaviyo Flow Configuration

Four event-triggered flows. Set up in Klaviyo dashboard with custom event names matching what your backend sends.

### Flow 1: Daily Check-in
- **Event:** `kinmatch_daily_checkin`
- **Recipient:** `{{ event.user_email }}`
- **Schedule:** Fires at 10am user-local (your cron handles timing)
- **Tokens:** `{{ user.first_name }}`, `{{ event.friend_name }}`, `{{ event.days_quiet }}`, `{{ event.memory_note }}`, `{{ event.action_url }}`
- **Suppression:** Skip if user has opened the app in the last 12 hours
- **Subject:** `{{ event.friend_name }}'s been quiet for {{ event.days_quiet }} days`

### Flow 2: Sunday Voice Drop
- **Event:** `kinmatch_sunday_voice_drop`
- **Schedule:** Sundays 4pm user-local
- **Tokens:** `{{ user.first_name }}`, `{{ event.candidates }}` (array of 3 with name, days_quiet, action_url)
- **Subject:** `It's Sunday. Who deserves a voice note this week?`

### Flow 3: Held Alert
- **Event:** `kinmatch_held_alert`
- **Recipient:** the holder's email (not the held person's)
- **Tokens:** `{{ holder.first_name }}`, `{{ event.held_name }}`, `{{ event.days_quiet }}`, `{{ event.action_url }}`
- **Subject:** `{{ event.held_name }} has been quiet for {{ event.days_quiet }} days`

### Flow 4: Voice Note Received (transactional)
- **Event:** `kinmatch_voice_note_received`
- **Recipient:** the recipient friend's email (collected during Add Connection)
- **Tokens:** `{{ sender.first_name }}`, `{{ event.voice_note_url }}` (share_token URL), `{{ event.duration }}`
- **Subject:** `{{ sender.first_name }} sent you a voice note`
- **Footer:** "KinMatch is how friends stay close to the people they're building life with. [Install free →]"

---

## 6. Third-Party Integration Details

### Whisper API (OpenAI)
- **Endpoint:** `POST https://api.openai.com/v1/audio/transcriptions`
- **Model:** `whisper-1`
- **Trigger:** Backend job after voice note finalize
- **Storage:** Result saved to `voice_notes.transcript`
- **Cost:** $0.006/min — ~$10/month at 500 notes/week
- **Error handling:** Retry once on failure; mark transcript as null if both fail (don't block voice note)

### Claude API (Anthropic)
- **Endpoint:** `POST https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-5`
- **Trigger:** When user opens PostSendCapture screen (lazy — only run if user will see results)
- **Prompt template:**
  ```
  Extract distinct memorable facts from this voice note transcript.
  Friend: {{ friend.name }}
  Transcript: "{{ transcript }}"
  Existing memory notes (avoid duplicates): {{ existing_memories }}
  
  Return JSON array of {text, tag, event_date?} for facts worth remembering long-term.
  Skip generic platitudes. Max 3 items.
  ```
- **Response format:** Structured JSON via response_format parameter
- **Cost:** ~$0.50/month at 500 notes/week

### Vercel Blob
- **Bucket:** `kinmatch-voice-notes`
- **Access:** Private bucket; voice notes served via signed URLs (expire 24hrs) for app users, share_token URLs for public listening
- **Retention:** All voice notes retained for 1 year minimum (compounding value); archive to cheaper storage after

### Supabase Row-Level Security
- **users table:** `auth.uid() = id`
- **friends table:** `auth.uid() = user_id`
- **memory_notes:** Join through friends — `friend_id IN (SELECT id FROM friends WHERE user_id = auth.uid())`
- **voice_notes:** Sender or recipient — `sender_user_id = auth.uid() OR recipient_user_id = auth.uid()` (and a separate public read policy for share_token)
- **held_relationships:** Holder or held — `holder_user_id = auth.uid() OR held_user_id = auth.uid()`

---

## 7. Implementation Sequence (12-week build)

**Weeks 1–2 — Foundation**
- Next.js project + Tailwind + brand tokens as CSS vars
- Supabase project + schema migration files for all 11 tables
- Auth flow (magic link + Google via Supabase Auth)
- Brand component library: `<BrandBar>`, `<BrandMark>`, `<Eyebrow>`, `<Headline>`, `<Subhead>`, `<PrimaryButton>`, `<SecondaryButton>`, `<TextLink>`, `<Avatar>`, `<ProgressDots>`

**Weeks 3–4 — Onboarding flow (Screens 1–9)**
- All 9 onboarding screens wired with local state
- `POST /api/onboarding/*` endpoints
- Bulk friend creation logic
- Holds setup logic

**Weeks 5–6 — Core surfaces**
- Today screen (Screen 10) with mock spotlight initially
- Person Profile (Screen 11) with read-only memory layer
- Tribe view component
- `GET /api/friends`, `GET /api/friends/:id` endpoints

**Week 7 — Voice notes (the wedge)**
- Voice recording screen (Screen 18) with MediaRecorder API
- Upload pipeline to Vercel Blob
- Public listening page at `/v/:share_token` (Screen 13 public variant)
- Klaviyo `voice_note_received` event setup

**Week 8 — Memory layer**
- Memory capture modal (Screen 12)
- `POST /api/friends/:id/memories`
- Display logic on Person Profile
- Whisper transcription pipeline
- Claude memory extraction pipeline
- Post-send capture moment (Screen 14)

**Week 9 — Today engine**
- Daily spotlight cron job
- Trigger computation logic (drift + memory + birthday for v1)
- `GET /api/today` returning computed spotlight
- Klaviyo `daily_checkin` event flow

**Week 10 — Held**
- Held setup wiring (Screen 7 → persisted)
- Held tab steady state (Screen 16)
- Held alert cron job
- Klaviyo `held_alert` event flow

**Week 11 — Voice inbox + AI suggestion layer**
- Voice notes inbox (Screen 15) with time bands
- AI suggestion layer (Screen 17)
- Voice note received in-app variant (Screen 13)

**Week 12 — Polish, pilot, deploy**
- Bug fixes from internal testing
- Pilot onboarding with 5–10 waitlist users
- Deploy to kinmatch.app (or use kinmatch.co)
- All Klaviyo flows live and tested
- Light analytics (PostHog or Plausible)

---

## 8. UI Patterns & States

**Loading states:** Skeleton cards in cream-deep, no spinners (too anxious for brand). Only on initial fetch; cached data renders instantly.

**Empty states:**
- Empty tribe: "Add your first connection to begin" with `+` button
- No spotlight today: "Everyone in your tribe is on rhythm. Take a quiet day." (calm, not anxious)
- Empty voice inbox: "When friends send you voice notes, they'll appear here."
- No memory notes on profile: "Add a note about [name] — anything small or specific."

**Error states:**
- Network: "Couldn't reach KinMatch. Try again in a moment." (no scary red banners)
- Auth: Handled by Supabase Auth's built-in UI
- Voice upload failure: Local cache + retry; never lose user's voice note

**Responsive design:**
- Mobile (≤480px): full-width
- Desktop: max-width 480px centered with cream-deep page background showing breathing room around the "phone-shaped" container
- No desktop-specific layouts in v1 — PWA experience is mobile-first
- All screens render correctly at 320px minimum width

**Animations:**
- All transitions: 250–300ms ease-out
- Reduce-motion users: instant transitions, no animations
- Constellation reveal: stagger faces in over 600ms total (per design)
- No spinners, no bouncing, no parallax — calm by default

---

## 9. Critical "Don'ts" During Build

These are easy to slip into and should be explicitly avoided:

- **Don't use shadow-lg, shadow-xl, or any dark drop shadows.** Use 0.5px borders instead.
- **Don't add success toasts ("Saved!" / "Done!").** Use small inline confirmations only.
- **Don't introduce streaks, badges, or progress counters that imply gamification.** Ritual counts ("4 in a row") are documentation, not rewards.
- **Don't have the AI write or suggest message text for the user to send.** AI suggests topics, context, and recipients — never sentences.
- **Don't surface "trending" or "popular" anything.** No social signals.
- **Don't add friend suggestions or "people you may know."** KinMatch is one-to-one only.
- **Don't request push notification permissions during onboarding.** Email is the v1 channel.
- **Don't show "X new" badges anywhere except the Held nav icon.** No notification anxiety.

---

*Anything not specified here defaults to "calm, italic-soft, deferential to user agency." When in doubt, do less.*
