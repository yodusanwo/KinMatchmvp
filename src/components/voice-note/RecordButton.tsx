import { Mic } from "lucide-react";
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
        "bg-terracotta text-white ring-2 ring-[#c2670a] transition-transform duration-200",
        "hover:bg-terracotta-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isRecording && "scale-105 ring-4 ring-[#c2670a]"
      )}
      aria-pressed={isRecording}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording ? (
        <span className="block h-9 w-9 rounded-lg bg-white transition-all duration-200" />
      ) : (
        <Mic className="h-11 w-11" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
