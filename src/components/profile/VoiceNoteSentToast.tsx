"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VoiceNoteSentToastProps = {
  friendName: string;
};

export function VoiceNoteSentToast({ friendName }: VoiceNoteSentToastProps) {
  const searchParams = useSearchParams();
  const sent = searchParams.get("voice_note_sent") === "1";
  const emailWarning = searchParams.get("email_warning") === "1";
  const [visible, setVisible] = useState(sent);

  useEffect(() => {
    if (!sent) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [sent]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 z-40 w-[min(100%-2.5rem,28rem)] -translate-x-1/2 rounded-2xl border border-ink/[0.12] bg-forest px-4 py-3 text-center shadow-lg"
      role="status"
    >
      <p className="font-inter text-sm text-cream">
        Voice note sent to {friendName}
      </p>
      {emailWarning && (
        <p className="mt-1 font-inter text-xs italic text-cream/80">
          Saved, but the email could not be sent. Check Klaviyo settings.
        </p>
      )}
    </div>
  );
}
