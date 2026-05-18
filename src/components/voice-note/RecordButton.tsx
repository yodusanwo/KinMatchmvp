import { cn } from "@/lib/cn";

type RecordButtonProps = {
  isRecording: boolean;
  disabled?: boolean;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave?: () => void;
};

export function RecordButton({
  isRecording,
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}: RecordButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        onPointerDown();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onPointerUp();
      }}
      onPointerLeave={onPointerLeave}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "flex h-[120px] w-[120px] touch-none select-none items-center justify-center rounded-full",
        "bg-terracotta text-cream shadow-md transition-transform duration-200",
        "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isRecording && "scale-105 ring-4 ring-terracotta/25"
      )}
      aria-pressed={isRecording}
      aria-label={isRecording ? "Recording, release to stop" : "Hold to record"}
    >
      <span
        className={cn(
          "block rounded-full bg-cream transition-all duration-200",
          isRecording ? "h-8 w-8" : "h-10 w-10"
        )}
      />
    </button>
  );
}
