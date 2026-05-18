"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/events";

/** Fires onboarding_started once per browser session when reflection begins. */
export function OnboardingStartedTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (sessionStorage.getItem("kinmatch-onboarding-started")) return;
    sessionStorage.setItem("kinmatch-onboarding-started", "1");
    trackEvent("onboarding_started");
    fired.current = true;
  }, []);

  return null;
}
