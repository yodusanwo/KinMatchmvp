"use client";

import { useCallback, useEffect, useState } from "react";
import { isNativePlatform } from "@/lib/audio/platform";
import {
  nativeMicBlockedMessage,
  queryMicrophonePermission,
} from "@/lib/audio/permissions";
import { requestMicrophonePermission } from "@/lib/audio/recorder";

export type MicSetupStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "blocked"
  | "unsupported";

export function useVoiceNotesMicSetup() {
  const [micStatus, setMicStatus] = useState<MicSetupStatus>("idle");
  const [micMessage, setMicMessage] = useState<string | null>(null);

  useEffect(() => {
    void queryMicrophonePermission().then((permission) => {
      if (permission === "granted") {
        setMicStatus("ready");
        setMicMessage("Voice notes are ready.");
      }
    });
  }, []);

  const requestMicrophone = useCallback(async () => {
    setMicMessage(null);
    setMicStatus("requesting");

    try {
      const permission = await requestMicrophonePermission();

      if (permission === "granted") {
        setMicStatus("ready");
        setMicMessage("Voice notes are ready.");
        return true;
      }

      if (permission === "unsupported") {
        setMicStatus("unsupported");
        setMicMessage(
          "This browser can't set up voice notes here. You can still continue."
        );
        return false;
      }

      setMicStatus("blocked");
      setMicMessage(
        isNativePlatform()
          ? nativeMicBlockedMessage()
          : "Your phone blocked the microphone. Turn it on in browser settings, or set this up later."
      );
      return false;
    } catch {
      setMicStatus("blocked");
      setMicMessage(
        isNativePlatform()
          ? nativeMicBlockedMessage()
          : "Could not reach the microphone. Try again."
      );
      return false;
    }
  }, []);

  return {
    micStatus,
    micMessage,
    micIsReady: micStatus === "ready",
    requestMicrophone,
  };
}
