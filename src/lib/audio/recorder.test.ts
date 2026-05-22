import { describe, expect, it } from "vitest";
import { recorderErrorMessage } from "@/lib/audio/permissions";
import { isRecorderError, resultFromAudioFile } from "@/lib/audio/recorder";
import { permissionDeniedError } from "@/lib/audio/types";

describe("recorder utilities", () => {
  it("maps permission errors to user-facing copy", () => {
    expect(recorderErrorMessage(permissionDeniedError(false))).toContain(
      "microphone"
    );
    expect(recorderErrorMessage(permissionDeniedError(true))).toContain(
      "blocked"
    );
  });

  it("detects recorder errors", () => {
    expect(isRecorderError({ code: "unknown", message: "x" })).toBe(true);
    expect(isRecorderError(new Error("nope"))).toBe(false);
  });

  it("builds a result from an audio file", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "note.m4a", {
      type: "audio/mp4",
    });
    const result = resultFromAudioFile(file);
    expect(result.mimeType).toBe("audio/mp4");
    expect(result.peaks).toHaveLength(30);
  });
});
