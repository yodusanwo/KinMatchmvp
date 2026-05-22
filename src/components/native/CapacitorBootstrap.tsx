"use client";

import { CapacitorAuthBridge } from "@/components/native/CapacitorAuthBridge";

/** Client-only hooks for the Capacitor native shell. */
export function CapacitorBootstrap() {
  return <CapacitorAuthBridge />;
}
