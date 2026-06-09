import { Eyebrow } from "@/components/brand";

type InsightsSectionProps = {
  weeklyReachOuts: number;
  weeklyVoiceNotes: number;
};

export function InsightsSection({
  weeklyReachOuts,
  weeklyVoiceNotes,
}: InsightsSectionProps) {
  return (
    <section className="rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-5">
      <Eyebrow>connection insights</Eyebrow>
      <div className="mt-4 space-y-2">
        <p className="font-inter text-sm text-ink">
          Reached out to {weeklyReachOuts}{" "}
          {weeklyReachOuts === 1 ? "person" : "people"}
        </p>
        <p className="font-inter text-sm text-ink">
          Sent {weeklyVoiceNotes} voice {weeklyVoiceNotes === 1 ? "note" : "notes"}
        </p>
      </div>
      <p className="mt-3 font-inter text-xs italic text-ink-soft">
        Last 7 days
      </p>
    </section>
  );
}
