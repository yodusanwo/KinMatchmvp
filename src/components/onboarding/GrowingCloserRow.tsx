import { MiniAvatar } from "./MiniAvatar";
import type { ConstellationFace } from "./ConstellationView";
import { cn } from "@/lib/cn";

type GrowingCloserRowProps = {
  faces: ConstellationFace[];
  className?: string;
};

function formatDisplayName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function GrowingCloserRow({ faces, className }: GrowingCloserRowProps) {
  return (
    <ul className={cn("flex flex-wrap items-start justify-center gap-8", className)}>
      {faces.map((face) => (
        <li key={face.id} className="flex flex-col items-center gap-2">
          <span className="rounded-full border border-dashed border-ink/40 p-1">
            <MiniAvatar
              name={face.name}
              avatarColor={face.avatarColor}
              size="lg"
            />
          </span>
          <span className="max-w-[80px] truncate font-sans text-xs text-ink">
            {formatDisplayName(face.name)}
          </span>
        </li>
      ))}
    </ul>
  );
}
