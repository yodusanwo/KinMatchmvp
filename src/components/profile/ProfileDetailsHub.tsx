import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Heart,
  Leaf,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import type { FriendProfile, MemoryCategory } from "@/lib/api/types";
import { formatDisplayName } from "@/lib/names/format";
import { cn } from "@/lib/cn";

type ProfileDetailsHubProps = {
  friend: FriendProfile;
  onAddMemory: (category: MemoryCategory) => void;
  onAddInterest: () => void;
};

type DetailRowProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  onAdd?: () => void;
};

const MEMORY_ROWS: {
  category: MemoryCategory;
  icon: DetailRowProps["icon"];
  title: string;
  empty: (name: string) => string;
}[] = [
  {
    category: "people",
    icon: Users,
    title: "Important people",
    empty: (name) => `Who matters to ${name}?`,
  },
  {
    category: "current",
    icon: Leaf,
    title: "Current chapter",
    empty: (name) => `What is ${name} going through?`,
  },
  {
    category: "loves",
    icon: Heart,
    title: "What they love",
    empty: (name) => `What is ${name} into?`,
  },
  {
    category: "dates",
    icon: Calendar,
    title: "Important dates",
    empty: () => `Birthday, milestones, anniversaries`,
  },
];

export function ProfileDetailsHub({
  friend,
  onAddMemory,
  onAddInterest,
}: ProfileDetailsHubProps) {
  const name = formatDisplayName(friend.name);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => onAddMemory("current")}
        className="flex w-full items-center gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/10 p-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta text-cream">
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-sans text-sm font-medium text-ink">
            Add something to remember
          </span>
          <span className="block truncate font-inter text-xs italic text-ink-soft">
            Any small detail about {name}
          </span>
        </span>
      </button>

      <div className="overflow-hidden rounded-2xl border border-ink/[0.12] bg-cream-deep/35">
        {MEMORY_ROWS.map((row) => {
          const count = friend.memories.filter(
            (note) => note.category === row.category
          ).length;
          return (
            <DetailRow
              key={row.category}
              icon={row.icon}
              title={row.title}
              subtitle={count > 0 ? `${count} saved` : row.empty(name)}
              onAdd={() => onAddMemory(row.category)}
            />
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/[0.12] bg-cream-deep/35">
        <DetailRow
          icon={Sparkles}
          title="Shared interests"
          subtitle={
            friend.shared_interests.length > 0
              ? friend.shared_interests
                  .slice(0, 3)
                  .map((interest) => interest.label)
                  .join(", ")
              : "Add what you both connect over"
          }
          onAdd={onAddInterest}
        />
        <DetailRow
          icon={MessageCircle}
          title="Shared moments"
          subtitle={`${friend.memories.filter((note) => note.category === "shared").length} saved`}
          onAdd={() => onAddMemory("shared")}
        />
        <Link
          href={`/friends/${friend.id}`}
          className="flex items-center gap-3 border-t border-ink/[0.08] p-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft">
            <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-sm font-medium text-ink">
              Back to profile
            </span>
            <span className="block truncate font-inter text-xs italic text-ink-soft">
              Return to the relationship dashboard
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function DetailRow({ icon: Icon, title, subtitle, onAdd }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 border-t border-ink/[0.08] p-3 first:border-t-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm font-medium leading-tight text-ink">
          {title}
        </p>
        <p className="mt-0.5 truncate font-inter text-xs italic text-ink-soft">
          {subtitle}
        </p>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            "text-ink-soft transition-colors hover:bg-cream"
          )}
          aria-label={`Add ${title.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}
