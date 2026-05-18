export type AnalyticsEvent =
  | "onboarding_started"
  | "onboarding_completed"
  | "voice_note_sent"
  | "memory_added"
  | "capture_from_paste_used";

export function trackEvent(
  name: AnalyticsEvent,
  props?: Record<string, string | number>
) {
  if (typeof window === "undefined") return;

  const plausible = (
    window as Window & {
      plausible?: (
        event: string,
        options?: { props?: Record<string, string | number> }
      ) => void;
    }
  ).plausible;

  if (!plausible) return;

  if (props) {
    plausible(name, { props });
  } else {
    plausible(name);
  }
}
