import { describe, expect, it } from "vitest";
import { rankFriendsForToday, scoreFriendForSpotlight } from "../spotlight-ranking";
import type { Friend, User } from "../types";

const today = new Date(2026, 4, 20);
const user: User = { id: "user-1", barriers: [] };

function friend(overrides: Partial<Friend>): Friend {
  return {
    id: overrides.id ?? "friend-1",
    name: overrides.name ?? "Friend",
    created_at: overrides.created_at ?? new Date(2026, 0, 1),
    is_wished_closer: false,
    memory_notes: [],
    touchpoints: [],
    ...overrides,
  };
}

describe("spotlight ranking", () => {
  it("keeps on-rhythm friends low priority", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "x",
        name: "Friend X",
        last_contact_at: new Date(2026, 4, 18),
        intended_cadence_days: 14,
      }),
      user,
      today
    );

    expect(result.components.cadence).toBe(0);
    expect(result.total_score).toBe(0);
  });

  it("caps overdue cadence at 40", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "y",
        name: "Friend Y",
        last_contact_at: new Date(2026, 3, 20),
        intended_cadence_days: 14,
      }),
      user,
      today
    );

    expect(result.components.cadence).toBe(40);
    expect(result.total_score).toBe(40);
  });

  it("prioritizes fresh unreplied inbound touchpoints", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "z",
        name: "Friend Z",
        last_contact_at: new Date(2026, 4, 15),
        intended_cadence_days: 14,
        last_inbound_touch_at: new Date(2026, 4, 19),
        last_outbound_touch_at: null,
      }),
      user,
      today
    );

    expect(result.components.cadence).toBe(0);
    expect(result.components.reciprocity).toBe(20);
    expect(result.total_score).toBe(20);
  });

  it("prioritizes upcoming life events", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "a",
        name: "Friend A",
        last_contact_at: new Date(2026, 4, 13),
        intended_cadence_days: 14,
        memory_notes: [
          {
            id: "birthday",
            category: "dates",
            event_date: "1985-05-23",
            created_at: new Date(2026, 0, 1),
          },
        ],
      }),
      user,
      today
    );

    expect(result.components.cadence).toBe(0);
    expect(result.components.life_event).toBe(25);
    expect(result.total_score).toBe(25);
  });

  it("adds decayed emotional weight from recent trusted notes", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "b",
        name: "Friend B",
        last_contact_at: new Date(2026, 3, 30),
        intended_cadence_days: 14,
        memory_notes: [
          {
            id: "trusted",
            category: "trusted",
            created_at: new Date(2026, 4, 10),
          },
        ],
      }),
      user,
      today
    );

    expect(result.components.cadence).toBeCloseTo(17.14, 2);
    expect(result.components.emotional_weight).toBeCloseTo(4.44, 2);
    expect(result.total_score).toBeCloseTo(21.59, 2);
  });

  it("penalizes friends spotlighted yesterday", () => {
    const result = scoreFriendForSpotlight(
      friend({
        id: "c",
        name: "Friend C",
        last_contact_at: new Date(2026, 2, 1),
        intended_cadence_days: 14,
        last_inbound_touch_at: new Date(2026, 4, 19),
        last_spotlight_at: new Date(2026, 4, 19),
        memory_notes: [
          {
            id: "event",
            category: "dates",
            event_date: "1990-05-23",
            created_at: new Date(2026, 0, 1),
          },
        ],
      }),
      user,
      today
    );

    expect(result.components.spotlight_fatigue).toBe(-100);
    expect(result.total_score).toBeLessThan(0);
  });

  it("ignores fatigue when the user only has one friend", () => {
    const [result] = rankFriendsForToday(
      [
        friend({
          id: "solo",
          name: "Solo",
          last_spotlight_at: today,
        }),
      ],
      user,
      today
    );

    expect(result.components.spotlight_fatigue).toBe(0);
  });

  it("breaks exact ties by oldest friendship first", () => {
    const ranked = rankFriendsForToday(
      [
        friend({ id: "newer", name: "Newer", created_at: new Date(2026, 1, 1) }),
        friend({ id: "older", name: "Older", created_at: new Date(2026, 0, 1) }),
      ],
      user,
      today
    );

    expect(ranked[0].friend_id).toBe("older");
  });
});
