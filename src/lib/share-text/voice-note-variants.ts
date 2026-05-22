import { firstName } from "@/lib/memories/categories";

export type VoiceNoteShareTextInput = {
  friend_first_name: string;
  days_quiet: number;
  is_inner_circle: boolean;
};

const VARIANT_COUNT = 4;

function variantIndex(input: VoiceNoteShareTextInput): number {
  const seed =
    input.friend_first_name.length +
    input.days_quiet +
    (input.is_inner_circle ? 7 : 0);
  return seed % VARIANT_COUNT;
}

function buildVariant(
  index: number,
  name: string,
  daysQuiet: number,
  isInnerCircle: boolean
): string {
  switch (index) {
    case 0:
      return `Hey ${name}, I left you a quick voice note —`;
    case 1:
      if (daysQuiet >= 14) {
        return `Hey ${name} — it's been a minute. Left you a voice note —`;
      }
      if (daysQuiet >= 7) {
        return `Hey ${name}, been thinking about you — left a voice note —`;
      }
      return `Hey ${name}, wanted to say hi — left you a voice note —`;
    case 2:
      return isInnerCircle
        ? `${name} — something I wanted to say out loud —`
        : `Hey ${name}, left you something to listen to —`;
    case 3:
    default:
      return `Hey ${name} — tap when you have a sec. Left a voice note —`;
  }
}

export function pickShareText(input: VoiceNoteShareTextInput): {
  text: string;
  variantIndex: number;
} {
  const name = firstName(input.friend_first_name) || "there";
  const index = variantIndex(input);
  return {
    text: buildVariant(index, name, input.days_quiet, input.is_inner_circle),
    variantIndex: index,
  };
}
