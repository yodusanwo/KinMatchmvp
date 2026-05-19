import { cn } from "@/lib/cn";

type RecordButtonProps = {
  isRecording: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function RecordButton({
  isRecording,
  disabled,
  onPress,
}: RecordButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "flex h-[120px] w-[120px] select-none items-center justify-center rounded-full",
        "bg-terracotta text-cream shadow-md transition-transform duration-200",
        "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isRecording && "scale-105 ring-4 ring-terracotta/25"
      )}
      aria-pressed={isRecording}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
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
