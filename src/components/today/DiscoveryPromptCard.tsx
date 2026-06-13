import Link from "next/link";
import type { TodayDiscoveryPrompt } from "@/lib/api/types";

type DiscoveryPromptCardProps = {
  prompt: TodayDiscoveryPrompt;
};

export function DiscoveryPromptCard({ prompt }: DiscoveryPromptCardProps) {
  return (
    <section className="rounded-2xl border border-ink/[0.12] bg-cream-deep/55 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-terracotta">
            Discovery · Day {prompt.day}
          </p>
          <p className="mt-1 line-clamp-2 font-inter text-sm italic leading-relaxed text-ink">
            {prompt.question}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Link
          href={prompt.primary_cta_url}
          className="flex-1 rounded-sm bg-terracotta px-3 py-2 text-center font-sans text-xs font-bold text-white"
        >
          {prompt.primary_cta_label}
        </Link>
        <Link href="/today" className="px-3 py-2 font-inter text-xs italic text-ink-soft">
          Skip
        </Link>
      </div>
    </section>
  );
}
