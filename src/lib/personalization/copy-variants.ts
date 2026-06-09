import type { BarrierKey } from "./types";

export const COPY_VARIANTS = {
  // Sentence appended to the welcome email body
  welcomeBody: {
    forget: "We'll be your rhythm so you don't have to remember.",
    distance: "Voice notes travel where calls can't.",
    busy: "60-second voice notes are enough. Really.",
    awkward: "We'll help you break the silence, gently.",
    unsure: "We'll help you ask the next question.",
    one_sided: "Held keeps you from being the only one reaching out.",
  },

  // Template strings used when generating the daily Today spotlight prompt
  // [name] = friend.name, [N] = days_quiet, [memory] = most recent memory note
  spotlightPromptStyle: {
    forget:
      "It's been [N] days since you reached out to [name]. A small nudge might be all it needs.",
    distance: "[name] crossed your mind for a reason. A voice note travels easy.",
    busy: "60 seconds for [name]? That's all this needs.",
    awkward:
      "It's been a while with [name]. An easy way back in: just say you've been thinking about them.",
    unsure: "[memory] Worth asking [name] how that's going?",
    one_sided:
      "[name] hasn't heard from you in [N] days. Your move when you're ready.",
  },

  // Subject lines for the daily check-in email
  dailyCheckinSubject: {
    forget: "[name]'s been quiet for [N] days",
    distance: "[name] crossed your mind for a reason",
    busy: "60 seconds for [name]?",
    awkward: "A gentle way back to [name]",
    unsure: "Something to follow up on with [name]",
    one_sided: "[name] is on your tribe, your move when you're ready",
  },
} as const satisfies Record<string, Record<BarrierKey, string>>;

export const DEFAULT_BARRIER_KEY: BarrierKey = "forget";
