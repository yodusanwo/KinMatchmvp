"use client";

import Link from "next/link";
import { useState } from "react";
import type { PendingCapturePrompt } from "@/lib/api/types";

type PendingCaptureCardProps = {
  capture: PendingCapturePrompt;
  onDismissed?: (interactionId: string) => void;
};

export function PendingCaptureCard({
  capture,
  onDismissed,
}: PendingCaptureCardProps) {
  const [dismissing, setDismissing] = useState(false);

  async function dismiss() {
    setDismissing(true);
    await fetch(`/api/capture-prompts/${capture.interaction_id}/dismiss`, {
      method: "POST",
    });
    onDismissed?.(capture.interaction_id);
  }

  return (
    <section className="rounded-2xl border border-terracotta/25 bg-terracotta/10 p-3">
      <p className="font-inter text-sm italic leading-relaxed text-ink">
        {capture.prompt}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Link
          href={`/friends/${capture.friend_id}/details?capture=${capture.interaction_id}`}
          className="flex-1 rounded-full bg-ink px-3 py-2 text-center font-sans text-xs font-medium text-white"
        >
          Capture →
        </Link>
        <button
          type="button"
          disabled={dismissing}
          onClick={() => void dismiss()}
          className="flex-1 rounded-full bg-cream-deep px-3 py-2 font-sans text-xs font-medium text-ink disabled:opacity-50"
        >
          Not yet
        </button>
      </div>
    </section>
  );
}
