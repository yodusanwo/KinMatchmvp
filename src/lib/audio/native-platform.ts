import { Capacitor } from "@capacitor/core";

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function nativeMicSettingsHint(): string {
  return "Settings → KinMatch → Microphone → Allow, then reopen the app.";
}
