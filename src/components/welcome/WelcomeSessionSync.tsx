"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-run the welcome page when the browser has a session the server missed. */
export function WelcomeSessionSync({ showForGuest }: { showForGuest: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!showForGuest) return;

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.refresh();
      }
    });
  }, [showForGuest, router]);

  return null;
}
