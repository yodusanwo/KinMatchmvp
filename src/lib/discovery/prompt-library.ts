import type { MemoryCategory } from "@/lib/memories/types";

export type DiscoveryPrompt = {
  cycle: number;
  question: string;
  category: MemoryCategory;
  depth_tier: 1 | 2 | 3;
  why_it_works: string;
};

export const MVP_DISCOVERY_PROMPTS: DiscoveryPrompt[] = [
  {
    cycle: 1,
    question: "Hey [Name] — how's your family doing these days?",
    category: "people",
    depth_tier: 1,
    why_it_works:
      "An easy way in. Most people love being asked about their people.",
  },
  {
    cycle: 2,
    question:
      "Hey [Name] — what have you been reading or watching lately? Anything you've been loving?",
    category: "loves",
    depth_tier: 1,
    why_it_works:
      "Low-stakes and easy to answer. Gives them room to share something they love.",
  },
  {
    cycle: 3,
    question: "Just thinking about you. What's been on your mind lately?",
    category: "current",
    depth_tier: 2,
    why_it_works:
      "Open and gentle. They can answer briefly or really get into it.",
  },
  {
    cycle: 4,
    question:
      "Bigger question for you — what's been giving you energy lately, and what's been draining it?",
    category: "current",
    depth_tier: 3,
    why_it_works:
      "Invites honest reflection — the good and the hard. Most people appreciate being asked.",
  },
  {
    cycle: 5,
    question:
      "Reaching out with a softer question — is there anything you've been carrying that you haven't really talked to anyone about?",
    category: "trusted",
    depth_tier: 3,
    why_it_works:
      "Soft and deep. The kind of question they might be waiting for someone to ask.",
  },
];

export const DISCOVERY_PROMPTS = MVP_DISCOVERY_PROMPTS;

export function getDiscoveryPromptForDay(day: number): DiscoveryPrompt | null {
  if (day < 1) return null;
  const cycle = Math.ceil(day / 2);
  return MVP_DISCOVERY_PROMPTS[cycle - 1] ?? null;
}

export function dayNumberForDiscoveryCycle(cycle: number): number {
  return cycle * 2 - 1;
}

export function renderDiscoveryQuestion(
  prompt: DiscoveryPrompt,
  friendName: string
): string {
  return prompt.question.replace(/\[Name\]/g, friendName);
}

export function discoveryPrimaryCtaLabel(): string {
  return "Send as voice note →";
}
