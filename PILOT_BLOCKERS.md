# KinMatch Pilot Blockers & Post-Contest Roadmap

This document tracks issues, bugs, and features identified during real-user testing 
that should be addressed before the founder pilot launches, as well as longer-term 
product enhancements discovered along the way.

**Status legend:**
- 🔴 BLOCKER — must fix before pilot launch
- 🟡 IMPORTANT — fix soon after launch
- 🟢 ENHANCEMENT — Q3/Q4 product roadmap

---

## 🔴 Home Screen: "Not yet" button does nothing

**Reported:** June 1, 2026 (Yewande, during day 3 testing)
**Status:** Open

**Symptom:** On the home screen prompt "What did [Friend] share?", the "Not yet" 
button has no visible effect. Tapping it doesn't advance, dismiss, or change state. 
The user is stuck on the prompt until they navigate to a different tab.

**Expected behavior:** 
- Tapping "Not yet" should dismiss the prompt and pivot to a different prompt OR 
  to the next-best friend to consider
- Should persist the "not yet" state so the same prompt doesn't reappear on next 
  page load

**Impact:** Blocks home screen progression. First impression issue for pilot users.

**Severity:** HIGH — needed before pilot launch

---

## 🔴 Home Screen: Stale prompt after voice note sent

**Reported:** June 2, 2026 (Yewande, real user testing)
**Status:** Open

**Symptom:** After sending a voice note to a friend, the home screen continues 
to prompt the user to reach out to that same friend. The header also incorrectly 
displays "[Friend] reached out today" alongside the outbound-reach prompt.

**Expected behavior:** Home screen should refresh after voice note send:
- Update friends.last_touch_at to NOW() for the friend
- Create an interactions row with mode='voice_note' and occurred_at=NOW()
- Pivot to a different prompt (different friend OR "capture what they said" 
  for the just-contacted friend)
- Header should not say "reached out today" when no incoming activity has occurred

**Impact:** Creates impression that app doesn't track user activity. Also affects 
agent reasoning since the agent uses the same last_touch_at signal.

**Severity:** HIGH — needed before pilot launch

---

## 🔴 Home Screen: "[Friend] reached out today" copy bug

**Reported:** June 2, 2026 (Yewande, real user testing)
**Status:** Open

**Symptom:** The card header on the home screen says "[Friend] reached out today" 
when the user has NOT received any communication from that friend. KinMatch has 
no way to know if a friend has reached out via channels outside the app.

**Root issue:** KinMatch currently only tracks interactions that happen INSIDE 
the app (voice notes sent). It cannot detect external interactions (calls, texts, 
in-person). The "reached out today" text is misleading because it implies inbound 
communication that the system has no way to verify.

**Suggested fix:**
- Replace "[Friend] reached out today" header with accurate copy
- Options: "It's time to reach out to [Friend]" or "Today's tribe focus: [Friend]"
- Never claim a friend "reached out" unless we have explicit data for that

**Severity:** HIGH — copy is misleading to pilot users

---

## 🟡 "Rotation" debug text on home screen card

**Reported:** June 2, 2026 (Yewande, real user testing)
**Status:** Open

**Symptom:** A "rotation" label appears below the prompt card without context. 
Appears to be debug output that escaped into production.

**Suggested fix:** Either remove entirely or properly label (e.g., "rotation: 1 of 4")

**Severity:** LOW-MEDIUM — looks unfinished

---

## 🟢 Future Feature: Track voice note listen events in agent reasoning

**Suggested:** June 2, 2026 (Yewande, while testing)
**Status:** Voice notes already track listen events. Agent reasoning doesn't use 
them yet. Contest scope (Option Y) includes wiring these into the agent.

**Discovery:** The voice_notes table already has `listened_at` and `listen_count` 
columns. This infrastructure was built but the agent doesn't reason about it.

**Contest scope:** YES — being added in Phase 5 Option Y

**Post-contest enhancement:** Use listen signals to trigger different home screen 
prompts ("Welu listened to your note 2 days ago — want to follow up?")

**Privacy considerations:** Do NOT surface as read receipts to user. Creates 
anxiety dynamics KinMatch is designed to prevent. Use only as agent reasoning 
input.

---

## 🟢 Future Feature: Auto-extract memory notes from voice transcripts

**Suggested:** June 2, 2026 (Yewande, while planning agent enhancements)
**Status:** Deferred to Q3 2026 post-contest roadmap

**Concept:** When a voice note is transcribed, agent reads the transcript and 
extracts notable facts/context about the friend (e.g., "Mary's dad had surgery", 
"Mary started a new job"). These get written as memory_notes on the friend's 
profile, enriching agent context for future decisions.

**Why deferred:** 
- Requires careful privacy/consent UX (showing user proposed notes before storage)
- AI extraction quality needs validation with real pilot data
- 6-10 hours engineering, too much for contest scope
- "Closing the loop" narrative already covered by agent_decisions audit log

**Proposed phased rollout:**
- Phase 1 (Q3): Suggest notes, user manually confirms each one
- Phase 2 (Q4): Auto-write with weekly review batch
- Phase 3 (later): Silent enrichment after trust validation

**Estimated effort:** 6-10 hours engineering + 2-3 weeks UX design

---

## 🟢 Future Feature: Linked profiles between sender and recipient

**Suggested:** June 2, 2026 (Yewande, during real-user testing)
**Status:** Major future feature — Q4 2026 / Q1 2027 roadmap

**Context:**
Voice notes are currently sent via shareable link. Recipients can sign up for 
KinMatch independently, but their account is not linked to the sender's friend 
record. The two profiles exist as completely separate entities in the database.

**Important discovery:** The voice_notes table already has `recipient_user_id` 
column suggesting linking was anticipated in the original schema design but never 
fully implemented.

**The architectural question:**
Should there be a "claim your profile" flow when a recipient signs up and there's 
a matching friend record (by email/phone)?

**Recommended approach: Consent-based linking**

When recipient signs up, match their email/phone against existing friend records. 
If a match is found, prompt: "It looks like [Sender] sent you the voice note 
that brought you here. Would you like to connect your profile to theirs? They'll 
see when you listen to their notes and when you send them ones back."

Explicit consent required from BOTH sides. Either can unlink at any time.

**Signals unlocked once linked:**
- Recipient's listen events on sender's voice notes
- Voice notes sender → recipient become two-way
- Mutual friend awareness (carefully, with consent)

**Schema implications:**
- friends.linked_user_id appears to exist OR add (verify)
- Add friends.link_consent_at and friends.link_consented_by_them_at
- Add interactions table support for inbound voice notes

**Privacy implications:**
- Phone/email matching must be opt-in, never automatic
- Either party can unlink without notification to the other
- Need updated privacy policy language
- Consider GDPR/CCPA implications

**Severity:** MEDIUM — Major feature, post-contest, Q4 2026 / Q1 2027 roadmap

**Estimated effort:** 1-2 weeks (schema + matching logic + dual-consent UI + 
testing + privacy review)

---

## 🟢 Future Feature: Tribe page should show archived friends

**Suggested:** June 2, 2026 (Yewande)
**Status:** Cursor Prompt B in progress as of June 2 afternoon

**Context:** When friends are archived (soft-deleted), they disappear entirely 
from the Tribe page. Users have no way to view or restore archived friends 
without using SQL directly.

**Proposed solution:**
- Add "ARCHIVED · [count]" section below "Acquaintances"
- Collapsed by default with "show" toggle
- Display archived friends with opacity-50 visual treatment + "ARCHIVED" badge
- Tapping archived friend shows action sheet with "Restore to [previous category]" 
  and "Delete permanently" actions

**Status update:** Cursor was implementing this when work paused for lunch. 
Will resume Wednesday.

---

## 🟢 Future Feature: External interactions logging

**Suggested:** June 2, 2026 (Yewande, while testing)
**Status:** Q4 2026 product roadmap

**Context:** KinMatch only knows about voice notes sent through the app. If user 
calls, texts, or sees friend in person outside the app, the relationship's 
"last_touch_at" doesn't update. This means the days_quiet counter only reflects 
in-app activity, not real connection patterns.

**Proposed solution:** One-tap UI for "I just talked to [Friend]" — options:
- "I called [Friend]"
- "I texted [Friend]"  
- "I saw [Friend] in person"

Each updates last_touch_at and creates an interactions row with appropriate mode.

**UX principle:** Optional, low-friction, never reminds user. Quick add buttons 
on friend profile, not modal interruptions.

**Why this matters:** Reflects real relationships, not just app activity. Currently 
heavy app users get accurate agent suggestions; light users get suggestions to 
reach out when they've already connected outside the app.

**Severity:** MEDIUM — important for accuracy but not blocking pilot

**Estimated effort:** 4-6 hours (UI + data model + agent integration)

---

## 🟢 Future Feature: Service account for production GCP authentication

**Suggested:** June 2, 2026
**Status:** Post-contest infrastructure work

**Context:** Agent currently uses Yewande's personal gcloud Application Default 
Credentials. These expire periodically and require reauth. Not deployable to 
production scheduled execution.

**Proposed solution:**
- Create service account in `kinmatch-relational-agent` GCP project
- Download JSON key
- Store as Vercel/deployment env var
- Update agent.py to use service account credentials in production environment

**Severity:** MEDIUM — needed before scheduled cron execution, not blocking pilot

**Estimated effort:** 2-4 hours

---

## 🟢 Future Feature: Real email sending via Klaviyo

**Suggested:** ongoing
**Status:** Post-contest

**Context:** Agent's `send_nudge` tool currently prints to console with 
"[PRODUCTION MODE — MOCKED]" label. No real emails go out.

**Proposed solution:** Wire send_nudge to Klaviyo API (already in user's stack) 
for actual nudge email delivery.

**Severity:** HIGH — required for pilot launch

**Estimated effort:** 4-6 hours

---

## 🟢 Future Feature: Multi-user scheduled execution

**Suggested:** ongoing
**Status:** Post-contest

**Context:** Agent currently runs manually for one user at a time. For pilot, 
needs to run automatically once per day for each pilot user.

**Proposed solution:** Cron job (Vercel Cron, GCP Cloud Scheduler, or similar) 
that iterates through pilot user list and runs the agent for each.

**Severity:** HIGH — required for pilot launch

**Estimated effort:** 6-8 hours (cron + monitoring + error handling + user list 
management)

---

## 🟢 Future Feature: Add `note` column to friends table OR keep memory_notes pattern

**Suggested:** June 1, 2026 (during schema review)
**Status:** Open product question

**Context:** Friends table has no direct `note` field. Emotional context is 
captured in separate `memory_notes` table linked by friend_id. This works but 
requires UI flow for capturing notes.

**Options:**
A) Add note column to friends for quick "primary note" + keep memory_notes for richer history
B) Keep current pattern but make memory_notes UI more discoverable

**Severity:** LOW — current pattern works, just affects UI design

**Estimated effort:** Depends on choice, 1-3 hours

---

## Document Maintenance

- Add new entries with date, reporter, status
- Move 🔴 to resolved section when fixed
- Review weekly during pilot

**Last updated:** June 2, 

---

## 🟡 Home Screen: Pivot to capture flow after voice note send

**Suggested:** June 2, 2026 (during Cursor investigation of stale prompt bug)
**Status:** Deferred to post-contest

**Context:** During investigation of the stale home screen prompt bug, Cursor 
identified a deeper UX improvement opportunity: after a voice note is sent, 
the home screen should automatically pivot to the "capture what [Friend] said" 
prompt for the just-contacted friend instead of either (a) showing stale state 
or (b) returning to a new friend prompt.

**Why this matters:** The moment immediately after sending a voice note is the 
highest-value window for capturing emotional context as memory notes. The user 
is mentally engaged with that friend. Pivoting to a capture prompt at this 
moment would:
- Reduce friction for memory note creation
- Eliminate the stale state bug entirely (different prompt = no stale issue)
- Create a natural rhythm: send → capture → next friend

**Cursor's proposed flow:**
1. User taps "Send" on voice note
2. Backend creates voice_note + interaction + updates last_touch_at (current behavior)
3. Backend sets capture_pending = true on the voice_note (already happens?)
4. Frontend navigates to /today with refresh signal
5. buildTodayState() returns kind: "capture" for this friend
6. User sees capture prompt: "What did [Friend] share?"

**CRITICAL CONCERN — NEEDS INVESTIGATION FIRST:**

Cursor's Option C proposal would eliminate the current share screen. But the 
share screen appears to be where the user gets the public voice note URL to 
actually send to the recipient (via iMessage, text, etc.). 

Before implementing this pivot:
1. Verify the actual current send flow: does it go send → share screen → 
   manual link share to friend?
2. If yes: Fix 2 needs to be "send → share → capture" NOT "send → capture"
3. The share step must be preserved because that's how the voice note 
   actually reaches the friend

**Recommended approach when revisiting:**
- Keep the share screen
- After user dismisses the share screen (either by tapping "Done" or navigating 
  away), THEN pivot to capture instead of returning to a fresh /today prompt
- Capture is the next step AFTER the user has actually shared the link

**Files involved (per Cursor investigation):**
- `/app/today/today-screen.tsx` — needs refresh logic
- `/app/friends/[id]/voice-note/voice-note-screen.tsx` (or share screen) — needs 
  post-share navigation update
- `/api/voice-notes/[id]/send/route.ts` — already correctly sets capture_pending

**Severity:** MEDIUM-HIGH — significantly improves pilot UX, not contest-blocking

**Estimated effort:** 2-3 hours (proper investigation + implementation + testing 
of share flow + capture pivot)

**Related stale text observation (June 2, 2026 afternoon):**
The "You haven't reached out to [Friend] yet" prompt text on the home screen 
also doesn't refresh after a voice note is sent. This is the same root cause 
as the capture pivot — no client-side state refresh after send. Both will be 
fixed together when Fix 2 is properly designed and implemented post-contest.

This is a UI display issue only. The agent's data layer is unaffected because 
the backend correctly updates `friends.last_touch_at` and creates an 
interactions row on voice note send (verified June 2 by Cursor investigation).