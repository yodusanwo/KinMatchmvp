import { fillPersonalizationTemplate } from "./fill-template";
import { getPersonalizedCopy } from "./get-personalized-copy";
import type { PersonalizableUser } from "./types";

export function formatDailyCheckinSubject(
  user: PersonalizableUser,
  friendName: string,
  daysQuiet: number
): string {
  const template = getPersonalizedCopy(user, "dailyCheckinSubject");
  return fillPersonalizationTemplate(template, {
    name: friendName,
    days: daysQuiet,
  });
}
