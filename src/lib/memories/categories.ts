import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Heart,
  Leaf,
  Lock,
  MessageCircle,
  Users,
} from "lucide-react";
import type { MemoryCategory } from "@/lib/memories/types";

export type MemoryCategoryConfig = {
  id: MemoryCategory;
  title: (firstName: string) => string;
  chipLabel: string;
  icon: LucideIcon;
  capturePlaceholder: (firstName: string) => string;
  emptyPrompt: (firstName: string) => { before: string; link: string; after: string };
};

export const MEMORY_CATEGORY_ORDER: MemoryCategory[] = [
  "people",
  "dates",
  "current",
  "loves",
  "shared",
  "trusted",
];

export const MEMORY_CATEGORIES: Record<MemoryCategory, MemoryCategoryConfig> =
  {
    people: {
      id: "people",
      title: () => "Important people",
      chipLabel: "People",
      icon: Users,
      capturePlaceholder: (name) =>
        `Partner Alex, ${name}'s kids Mia and Noah, dog Biscuit…`,
      emptyPrompt: (name) => ({
        before: "Who's important to ",
        link: name,
        after: "? →",
      }),
    },
    dates: {
      id: "dates",
      title: () => "Important dates",
      chipLabel: "Dates",
      icon: Calendar,
      capturePlaceholder: (name) => `${name}'s birthday — October 12…`,
      emptyPrompt: (name) => ({
        before: "Add ",
        link: `${name}'s birthday`,
        after: " →",
      }),
    },
    current: {
      id: "current",
      title: () => "Current chapter",
      chipLabel: "Current",
      icon: Leaf,
      capturePlaceholder: () =>
        "She's training for a half marathon in October…",
      emptyPrompt: (name) => ({
        before: "What's ",
        link: name,
        after: " going through right now? →",
      }),
    },
    loves: {
      id: "loves",
      title: (name) => `What ${name} loves`,
      chipLabel: "Loves",
      icon: Heart,
      capturePlaceholder: (name) =>
        `${name} loves sci-fi, sourdough, and morning runs…`,
      emptyPrompt: (name) => ({
        before: "What's ",
        link: name,
        after: " into? →",
      }),
    },
    shared: {
      id: "shared",
      title: () => "Shared moments",
      chipLabel: "Shared",
      icon: MessageCircle,
      capturePlaceholder: () =>
        "That time we got lost in Austin — we still quote it…",
      emptyPrompt: () => ({
        before: "",
        link: "Inside jokes, history, 'remember when'…",
        after: " →",
      }),
    },
    trusted: {
      id: "trusted",
      title: () => "Trusted with you",
      chipLabel: "Trusted",
      icon: Lock,
      capturePlaceholder: () =>
        "Worried about her mom's health — shared in confidence…",
      emptyPrompt: (name) => ({
        before: "Things ",
        link: name,
        after: " has shared in confidence →",
      }),
    },
    other: {
      id: "other",
      title: () => "Other",
      chipLabel: "Other",
      icon: Leaf,
      capturePlaceholder: (name) => `Something worth remembering about ${name}…`,
      emptyPrompt: (name) => ({
        before: "Add a note about ",
        link: name,
        after: " →",
      }),
    },
  };

export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return fullName;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export const MEMORY_MODAL_CATEGORIES: MemoryCategory[] = [
  "people",
  "dates",
  "current",
  "loves",
  "shared",
  "trusted",
];
