# Spotlight Ranking Algorithm

KinMatch uses the spotlight ranking algorithm to decide which friend appears on the Today screen. The goal is to pick the person who most likely needs a small, timely touch today.

The implementation lives in `src/lib/algorithm/spotlight-ranking.ts`.

## Where It Runs

The algorithm runs inside `GET /api/today` every time the Today endpoint is hit.

The endpoint:

1. Loads the current user and their barriers.
2. Loads tribe friends with memory notes, interactions, cadence, and spotlight history.
3. Scores every friend.
4. Sorts friends by score.
5. Returns the top friend as `spotlight`.
6. Returns the next three as `upNext`.
7. Logs the selected spotlight in `spotlight_feedback`.
8. Updates `friends.last_spotlight_at` for fatigue tracking.

## Inputs

Each friend is scored using:

- `last_touch_at`
- `cadence_days`
- `is_wished_closer`
- `last_spotlight_at`
- `memory_notes`
- `interactions`
- derived inbound/outbound touch history

The user contributes:

- `barriers`, from onboarding

## Score Components

Each friend receives six component scores:

```ts
type SpotlightComponents = {
  cadence: number;
  life_event: number;
  reciprocity: number;
  emotional_weight: number;
  spotlight_fatigue: number;
  barrier_match: number;
};
```

The total score is the sum of all six components.

## 1. Cadence Score

Max: `+40`

Cadence answers: “How overdue is this friendship?”

If a friend has never been contacted, they get `30` points so new friends appear soon for a first touch.

If they are still on rhythm, they get `0`.

If they are overdue, the score scales by how far past cadence they are:

- 50% overdue: about `20`
- 100% overdue: `40`
- More than 100% overdue: capped at `40`

Example:

If intended cadence is 14 days and it has been 30 days:

```text
days overdue = 30 - 14 = 16
slip ratio = 16 / 14
score = capped at 40
```

## 2. Life Event Score

Max: `+25`

Life event answers: “Is there an important date coming up or recently missed?”

It looks at memory notes where:

- `category = "dates"`
- `event_date` exists

Dates are annualized, so a birthday from `1985-05-23` is treated as this year’s next or very recent occurrence.

Scoring:

- Event in 0-7 days: `25`
- Event in 8-14 days: `15`
- Event in 15-30 days: `8`
- Event missed within the last 3 days: `20`

Only the highest life-event score counts.

## 3. Reciprocity Score

Max: `+20`

Reciprocity answers: “Did they reach out, and the user has not replied?”

It compares the latest inbound interaction against the latest outbound interaction.

If the user reached out after the friend did, there is no reciprocity debt.

Scoring:

- Unreplied inbound within 1 day: `20`
- Within 3 days: `15`
- Within 7 days: `10`
- Within 14 days: `5`
- Older than 14 days: `0`

The app currently maps this from `interactions.direction`.

## 4. Emotional Weight Score

Max: `+25`

Emotional weight answers: “Is something meaningful or hard happening in their life?”

It looks at recent memory notes with:

- `category = "current"`
- `category = "trusted"`

Notes decay linearly over 90 days.

Weights:

- `trusted`: `5`
- `current`: `3`

Recent notes count more. Notes older than 90 days do not contribute.

Example:

A trusted note from 10 days ago:

```text
decay = 1 - (10 / 90) = 0.888...
score = 5 * 0.888... = 4.44
```

## 5. Spotlight Fatigue

Range: `0` to `-100`

Fatigue answers: “Have we shown this person too recently?”

Scoring:

- Spotlighted today or yesterday: `-100`
- Less than 3 days ago: `-30`
- Less than 5 days ago: `-15`
- Less than 7 days ago: `-5`
- 7+ days ago: `0`

If the user has only one friend, fatigue is ignored so they still get a spotlight.

## 6. Barrier Match

Max: `+15`

Barrier match answers: “Does this friend fit the user’s relationship friction?”

The user’s primary barrier is picked from onboarding answers.

Current behavior:

- `forget` or `awkward`: boost long-quiet friendships.
- `distance`: small uniform boost.
- `busy`: small uniform boost.
- `unsure`: boost friends with more memory context.
- `one_sided`: boost balanced relationships, not one-sided ones.

This is intentionally simple in v1.0. It gives the ranking a little personalization without making the model opaque.

## Ranking

Friends are ranked by `total_score`, highest first.

If scores tie exactly, the oldest friendship wins using `created_at ASC`.

This means the algorithm still works if everyone is “on rhythm” and scores near zero.

## Output

Each scored friend returns:

```ts
type FriendScore = {
  friend_id: string;
  friend: Friend;
  total_score: number;
  components: SpotlightComponents;
  primary_reason: string;
};
```

`primary_reason` is a human-readable explanation of the top positive driver, such as:

- `Lisa reached out — you haven't replied yet`
- `Lisa has an important date coming up`
- `Lisa has something going on right now`
- `it's been a while with Lisa`
- `a good moment to reach out to Lisa`

## Today API Response

`/api/today` still returns the UI-friendly `spotlight` and `tribe` fields, with `upNext` added:

```ts
{
  spotlight,
  upNext,
  tribe
}
```

`spotlight` includes debug-friendly optional fields:

- `total_score`
- `component_scores`
- `primary_reason`

The UI does not need to show these yet, but they are useful for debugging and future transparency.

## Feedback Logging

Every selected spotlight is logged in `spotlight_feedback`:

```sql
user_id
friend_id
spotlight_at
total_score
component_scores
action
action_at
```

When the user acts on a spotlight, call:

```http
POST /api/spotlight/feedback
```

Body:

```json
{
  "friend_id": "friend-id",
  "action": "engaged"
}
```

Supported actions:

- `engaged`
- `skipped`
- `snoozed`
- `replaced`

This updates the most recent feedback row for that user and friend.

## Database Fields

The spotlight migration adds:

- `friends.last_spotlight_at`
- `interactions.direction`
- `spotlight_feedback`

The original request mentioned a `touchpoints` table. This app currently uses `interactions`, so the migration adds `direction` there. It also safely attempts to add `touchpoints.direction` if that table exists in a future schema.

## Tests

Tests live in:

```text
src/lib/algorithm/__tests__/spotlight-ranking.test.ts
```

They cover:

- on-rhythm friends
- overdue friends
- unreplied inbound touchpoints
- upcoming birthdays
- decayed trusted notes
- spotlight fatigue
- one-friend fatigue override
- tie-breaking by oldest friendship

Run:

```bash
npm test
```

## Future Tuning

Do not build these into v1.0 yet:

- per-user weight tuning from engagement history
- ML-based ranking
- keyword boosting for serious life events
- time-of-day preferences
- multiple daily spotlights

The current algorithm is deliberately transparent, fast, and easy to tune once `spotlight_feedback` has real usage data.
