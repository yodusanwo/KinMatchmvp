"use client";

import { useEffect } from "react";
import { isNativePlatform } from "@/lib/audio/platform";

const APP_SCHEME = process.env.NEXT_PUBLIC_NATIVE_APP_SCHEME ?? "kinmatch";

/**
 * Routes magic-link / OAuth callbacks from the native URL scheme into the web app.
 */
export function CapacitorAuthBridge() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    let removeListener: (() => void) | undefined;

    async function bind() {
      const { App } = await import("@capacitor/app");

      const handleUrl = (url: string) => {
        const prefix = `${APP_SCHEME}://`;
        if (!url.startsWith(prefix)) return;

        const path = `/${url.slice(prefix.length)}`;
        if (path.startsWith("/auth/callback")) {
          window.location.href = path;
        }
      };

      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        handleUrl(launch.url);
      }

      const listener = await App.addListener("appUrlOpen", (event) => {
        if (event.url) handleUrl(event.url);
      });
      removeListener = () => listener.remove();
    }

    void bind();

    return () => {
      removeListener?.();
    };
  }, []);

  return null;
}
