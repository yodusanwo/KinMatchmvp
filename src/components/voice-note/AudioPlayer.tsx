"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { formatDuration } from "@/components/voice-note/format-duration";
import { cn } from "@/lib/cn";

type AudioPlayerProps = {
  audioUrl: string;
  peaks: number[];
  durationSeconds: number;
  className?: string;
};

export function AudioPlayer({
  audioUrl,
  peaks,
  durationSeconds,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      setCurrentTime(audio?.currentTime ?? 0);
    }

    function onLoadedMetadata() {
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      }
    }

    function onEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
    }

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const progress =
    duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playedBars = Math.floor(progress * peaks.length);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
    });
  }

  return (
    <div className={cn("w-full", className)}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        className="sr-only"
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-terracotta text-cream transition-colors hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          aria-label={isPlaying ? "Pause" : "Play voice note"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          )}
        </button>

        <div
          className="flex h-14 flex-1 items-end justify-between gap-0.5"
          aria-hidden
        >
          {peaks.map((peak, index) => {
            const isPlayed = index < playedBars;
            return (
              <span
                key={index}
                className={cn(
                  "w-1 rounded-full transition-colors duration-150",
                  isPlayed ? "bg-terracotta" : "bg-terracotta/35"
                )}
                style={{ height: `${Math.round(10 + peak * 36)}px` }}
              />
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-xs text-ink-soft">
        {formatDuration(Math.floor(currentTime))} / {formatDuration(duration)}
      </p>
    </div>
  );
}
