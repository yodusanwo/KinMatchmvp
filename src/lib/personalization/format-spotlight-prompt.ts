import { pickPrimaryBarrier } from "./barriers";
import { COPY_VARIANTS } from "./copy-variants";
import { fillPersonalizationTemplate } from "./fill-template";
import type { PersonalizableUser } from "./types";

/** Build a Today spotlight line from the user's primary barrier template. */
export function formatPersonalizedSpotlightPrompt(
  user: PersonalizableUser,
  name: string,
  daysQuiet: number,
  memory?: string | null
): string {
  if (daysQuiet <= 0) {
    return `You haven't reached out to ${name} yet. A small first note is enough.`;
  }

  const primary = pickPrimaryBarrier(user.barriers ?? []);
  let template = COPY_VARIANTS.spotlightPromptStyle[primary];

  if (primary === "unsure" && !memory?.trim()) {
    template = COPY_VARIANTS.spotlightPromptStyle.busy;
  }

  return fillPersonalizationTemplate(template, {
    name,
    days: daysQuiet,
    memory,
  });
}
