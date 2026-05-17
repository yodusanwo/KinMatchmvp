# KinMatch — MVP Brief

*One page. North star. Everything we've decided.*

---

## Hypothesis

Meaningful friendships aren't usually lost because people stop caring. They're lost because modern life disrupts the consistency, continuity, and emotional momentum required for relationships to deepen. KinMatch is the gentle infrastructure that restores those three things.

## The wedge

**KinMatch is the voice-first app that helps you stay in real touch with the people you're building life with.**

## Target user

Working professionals 30–59, dissatisfied with current closeness in their adult friendships. Research from the 74-respondent survey: 63% of 45–59-year-olds want more meaningful connection. Singles feel this most acutely — 21% satisfied vs 59% for married. The top barrier across all groups is scheduling friction (45% of respondents). Disconnection peaks on Friday evenings, weekends, and after life changes. Secondary entry points: recent movers, drained professionals (behavioral health, accounting, single parents).

## What KinMatch is

A small, calm tool for tending the relationships you already have. It remembers what matters about each person in your Core Tribe, surfaces them at the right moments, and gives you frictionless ways to reach out — primarily through voice notes. It does not match strangers, run feeds, or gamify connection.

## v1 features — ship at week 12

1. **Onboarding reflection** — three questions to identify your tribe (who you spend time with, who you wish were closer, what gets in the way)
2. **Today** — one suggested check-in plus tribe at a glance
3. **Core Tribe view** — visual constellation of your 5–10 closest
4. **Person Profile** — memory layer, shared interests, rhythm history
5. **Voice notes** — primary outbound and inbound action; sent via web-link distribution (no install required to listen)
6. **Memory capture** — type or speak what's worth remembering; AI extracts dated facts
7. **AI suggestion layer** — topics not scripts; the AI helps you reach out but never speaks for you
8. **Held** — reciprocal accountability circle (1–2 watchers) who get gently notified if you go quiet beyond a threshold you set

## Locked glossary

- **Core Tribe** — your inner circle of 5–10 people
- **Connection** — an individual person in your tribe
- **Reach out** — the action verb (never "engage" or "ping")
- **Held** — reciprocal accountability layer
- **Ritual** — a recurring touchpoint with someone
- **Moment** — a single past interaction
- **Prompt** — what the AI offers (never a script)

## Explicit non-goals

- No swiping, no feeds, no public posts
- No streaks, badges, or popularity loops
- No AI ghostwriting — AI suggests topics, never sentences
- No stranger matching or discovery
- No commerce or affiliate hooks
- No anxiety-driven notifications

## Build phasing

**v1 (weeks 1–12):** Eight features above. Web/PWA via Next.js on Vercel. Email-only via Klaviyo. Magic-link auth.

**v1.1 (3 months post-launch):** Sunday Voice Drop ritual; auto-extraction of memory facts from voice notes via Claude API; Web Push notifications for installed PWAs; optional SMS via Klaviyo.

**v1.2 (6 months post-launch):** Reciprocity triggers (incoming voice notes surface as high-priority spotlights); ritual reminders; Kin (AI confidant for one-on-one reflection); searchable voice transcript archive.

**v2:** React Native via Expo for native push and App Store. Full priority engine for the 8-category trigger taxonomy. Held insights and reciprocity dashboards.

## Stack

Next.js + Vercel (hosting, cron) · Supabase (Postgres + auth) · Klaviyo (email) · Vercel Blob (voice audio storage) · Whisper API (transcription, ~$10/mo at 500 notes/week) · Claude API (memory extraction, ~$0.50/mo at same volume) · Clerk or Supabase Auth (magic links + Google sign-in)

## Distribution model — voice notes

**Open distribution with strong install pull.** Anyone can listen to a KinMatch voice note via a unique web link — no install required. After listening, a soft footer invites them to install KinMatch to send notes of their own. This removes adoption gating while creating a Loom-style viral mechanic: the *sender* always needs KinMatch (for relationship management); the *recipient* is pulled in by experiencing an unusually warm message.

## Notification strategy

- **v1:** Email-only via Klaviyo. Three flow types — daily check-in, Sunday Voice Drop, Held alerts. Max ~3 emails per active user per week.
- **v1.1:** Add Web Push for installed PWA users (iOS 16.4+, Android, desktop).
- **v2:** Native push via Expo wrapper.

The screen formerly framed as "notification permissions" is now a "we'll email you, not interrupt you" confirmation. No native push permission requests in v1.

## Trigger taxonomy — what surfaces someone on Today

Eight categories ranked by emotional weight: (1) rhythm-based drift, (2) calendar events (birthdays, anniversaries), (3) memory-anchored events (health, family, work, milestones), (4) life transitions (move, loss, marriage), (5) reciprocity (unanswered voice notes), (6) Held alerts, (7) ritual reminders, (8) shared experience anniversaries. v1 ships categories 1–3 + birthdays. Full priority engine in v2.

## Metrics to watch

- Onboarding completion rate (target >70%)
- Voice notes sent per active user per week (target >2 by week 4)
- Memory notes captured per friend per month (target >3 by day 30)
- Day-7 / Day-30 / Day-90 retention curve
- Held alert response rate — do watchers actually reach back?
- Voice note listen-through rate (open distribution viral signal)

## Brand voice

Calm, intentional, italic-soft. Speaks to the user the way a thoughtful friend would. Never urgent. Never gamified. The product is patient with you, not pushy. Reads like a letter on paper, not a notification on a phone.

**Color:** Cream `#F2EAD9`, cream-deep `#EBE0C9`, ink `#1F1A14`, ink-soft `#463C2E`, terracotta `#B65232`, terracotta-deep `#8E3D22`, forest `#2F4032`, sage `#6B7A5C`, mustard `#C68F3E`, honey `#E8D494`.

**Typography:** Inter regular and italic + Instrument Sans. Italic for emotional voice; sans for structural information. 11px uppercase eyebrows at 0.12em letter-spacing. Two weights only — 400 regular, 500 medium.

**UI primitives:** Soft cream backgrounds, 0.5px borders, rounded corners (12–16px on cards, 999px on pill buttons), terracotta CTAs for brand-defining moments, dark ink CTAs for sequential progress, underlined small text for soft deferrals.

---

*"KinMatch helps you stay close to the people who matter most."*
