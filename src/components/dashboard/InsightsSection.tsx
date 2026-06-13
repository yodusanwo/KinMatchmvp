import { Eyebrow } from "@/components/brand";

type InsightsSectionProps = {
  weeklyReachOuts: number;
  weeklyVoiceNotes: number;
};

type Metric = {
  value: number;
  label: string;
};

function MetricCard({ value, label }: Metric) {
  return (
    <div className="rounded-lg border border-hairline bg-cream px-4 py-3">
      <p className="font-display text-[28px] leading-none text-ink">{value}</p>
      <p className="mt-1.5 font-sans text-xs text-slate">{label}</p>
    </div>
  );
}

export function InsightsSection({
  weeklyReachOuts,
  weeklyVoiceNotes,
}: InsightsSectionProps) {
  return (
    <section className="rounded-lg border border-hairline bg-cream-deep p-5">
      <Eyebrow>connection insights</Eyebrow>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MetricCard
          value={weeklyReachOuts}
          label={weeklyReachOuts === 1 ? "person reached" : "people reached"}
        />
        <MetricCard
          value={weeklyVoiceNotes}
          label={weeklyVoiceNotes === 1 ? "voice note sent" : "voice notes sent"}
        />
      </div>
      <p className="mt-3 font-sans text-xs italic text-slate">Last 7 days</p>
    </section>
  );
}
