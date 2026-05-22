/** True when running inside a Capacitor native shell (iOS/Android). */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export async function getNativePlatform(): Promise<"ios" | "android" | "web"> {
  if (!isNativePlatform()) return "web";
  try {
    const { Capacitor } = await import("@capacitor/core");
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") return platform;
  } catch {
    // fall through
  }
  return "web";
}

export async function openAppSettings(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const platform = await getNativePlatform();

  if (platform === "ios") {
    window.location.href = "app-settings:";
    return true;
  }

  if (platform === "android") {
    window.location.href =
      "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:app.kinmatch.mvp;end";
    return true;
  }

  return false;
}
