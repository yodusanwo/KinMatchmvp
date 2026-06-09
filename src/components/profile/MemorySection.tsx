"use client";

import { useMemo, useState } from "react";
import type { MemoryCategory, MemoryNote } from "@/lib/api/types";
import {
  MEMORY_CATEGORIES,
  MEMORY_CATEGORY_ORDER,
  firstName,
} from "@/lib/memories/categories";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";
import { MemoryCategoryFilters } from "./MemoryCategoryFilters";
import { MemorySearchInput } from "./MemorySearchInput";

type MemorySectionProps = {
  friendName: string;
  memories: MemoryNote[];
  onAddCategory: (category: MemoryCategory) => void;
  highlightId?: string | null;
  showAddControls?: boolean;
};

const DISPLAY_CATEGORIES: MemoryCategory[] = [...MEMORY_CATEGORY_ORDER, "other"];

export function MemorySection({
  friendName,
  memories,
  onAddCategory,
  highlightId,
  showAddControls = true,
}: MemorySectionProps) {
  const name = firstName(friendName);
  const [expandedCategories, setExpandedCategories] = useState<Set<MemoryCategory>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<MemoryCategory>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter memories by search query
  const filteredMemories = useMemo(() => {
    if (!searchQuery) return memories;
    const query = searchQuery.toLowerCase();
    return memories.filter((note) => note.text.toLowerCase().includes(query));
  }, [memories, searchQuery]);

  const byCategory = useMemo(
    () =>
      DISPLAY_CATEGORIES.reduce(
        (acc, category) => {
          acc[category] = filteredMemories.filter((note) => note.category === category);
          return acc;
        },
        {} as Record<MemoryCategory, MemoryNote[]>
      ),
    [filteredMemories]
  );

  const categoriesWithContent = DISPLAY_CATEGORIES.filter(
    (category) => byCategory[category].length > 0
  );

  // Filter categories based on active filters
  const visibleCategories = useMemo(() => {
    if (activeFilters.size === 0) return categoriesWithContent;
    return categoriesWithContent.filter((cat) => activeFilters.has(cat));
  }, [categoriesWithContent, activeFilters]);

  // Calculate memory counts for filter chips (use unfiltered memories)
  const memoryCounts = useMemo(() => {
    return DISPLAY_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = memories.filter((note) => note.category === category).length;
        return acc;
      },
      {} as Record<MemoryCategory, number>
    );
  }, [memories]);

  const toggleCategory = (categoryId: MemoryCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-terracotta">
          Things to remember
        </p>
        <h2 className="font-serif text-2xl leading-tight text-ink">
          What helps you show up for {name}?
        </h2>
        <p className="font-inter text-sm italic leading-relaxed text-ink-soft">
          Capture small details as they come to you. KinMatch will surface them
          when they matter.
        </p>
      </div>

      {showAddControls && (
        <button
          type="button"
          onClick={() => onAddCategory("current")}
          className="group flex w-full items-center gap-3 rounded-2xl border border-terracotta/35 bg-terracotta/10 p-4 text-left transition-colors active:bg-terracotta/15"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta text-cream">
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-sm font-medium text-ink">
              Add something to remember
            </span>
            <span className="mt-0.5 block font-inter text-xs italic leading-relaxed text-ink-soft">
              A birthday, a person they love, what they&apos;re going through, or
              any small detail.
            </span>
          </span>
        </button>
      )}

      {categoriesWithContent.length > 0 && (
        <>
          <MemorySearchInput
            friendName={friendName}
            onSearchChange={setSearchQuery}
          />

          <MemoryCategoryFilters
            categories={categoriesWithContent}
            memoryCounts={memoryCounts}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
          />

          {visibleCategories.length > 0 ? (
            <div className="space-y-3">
              {visibleCategories.map((categoryId) => (
                <MemoryPromptCard
                  key={categoryId}
                  categoryId={categoryId}
                  friendName={friendName}
                  firstName={name}
                  notes={byCategory[categoryId]}
                  highlightId={highlightId}
                  onAddCategory={onAddCategory}
                  showAddControls={showAddControls}
                  isExpanded={expandedCategories.has(categoryId)}
                  onToggleExpand={toggleCategory}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/[0.08] bg-cream-deep/25 p-6 text-center">
              <p className="font-inter text-sm italic text-ink-soft">
                {searchQuery
                  ? `No notes match "${searchQuery}"`
                  : "No notes in selected categories"}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

type MemoryPromptCardProps = {
  categoryId: MemoryCategory;
  friendName: string;
  firstName: string;
  notes: MemoryNote[];
  onAddCategory: (category: MemoryCategory) => void;
  highlightId?: string | null;
  showAddControls: boolean;
  isExpanded: boolean;
  onToggleExpand: (categoryId: MemoryCategory) => void;
};

function MemoryPromptCard({
  categoryId,
  friendName,
  firstName: name,
  notes,
  onAddCategory,
  highlightId,
  showAddControls,
  isExpanded,
  onToggleExpand,
}: MemoryPromptCardProps) {
  const config = MEMORY_CATEGORIES[categoryId];
  const Icon = config.icon;
  const empty = config.emptyPrompt(name);
  const visibleNotes = isExpanded ? notes : notes.slice(0, 2);
  const hasMoreNotes = notes.length > 2;

  return (
    <article
      className={cn(
        "rounded-2xl border border-ink/[0.12] bg-cream-deep/35 p-3.5"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream">
          <Icon
            className="h-4 w-4 text-ink-soft"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-sm font-medium leading-snug text-ink">
                {config.title(name)}
              </h3>
              {notes.length === 0 && (
                <p className="mt-0.5 font-inter text-xs italic leading-relaxed text-ink-soft">
                  {empty.before}
                  <span className="text-terracotta underline decoration-terracotta/70 underline-offset-2">
                    {empty.link}
                  </span>
                  {empty.after}
                </p>
              )}
            </div>
            {showAddControls && (
              <button
                type="button"
                onClick={() => onAddCategory(categoryId)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-cream"
                aria-label={`Add ${config.chipLabel.toLowerCase()} note about ${friendName}`}
              >
                <Plus
                  className="h-3.5 w-3.5 text-ink-soft"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            )}
          </div>

          {visibleNotes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {visibleNotes.map((note) => (
                <li
                  key={note.id}
                  className={cn(
                    "rounded-xl bg-cream/70 px-3 py-2 font-inter text-xs italic leading-[1.5] transition-colors duration-500",
                    highlightId === note.id
                      ? "text-ink ring-1 ring-terracotta/40"
                      : "text-ink-soft/80"
                  )}
                >
                  {note.text}
                  {note.event_date && categoryId === "dates" ? (
                    <span className="not-italic text-ink-soft/60">
                      {" "}
                      ({formatEventDate(note.event_date)})
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {hasMoreNotes && !isExpanded && (
            <button
              type="button"
              onClick={() => onToggleExpand(categoryId)}
              className="mt-1.5 font-inter text-[11px] italic text-ink-soft hover:text-terracotta transition-colors"
            >
              +{notes.length - visibleNotes.length} more saved
            </button>
          )}

          {isExpanded && hasMoreNotes && (
            <button
              type="button"
              onClick={() => onToggleExpand(categoryId)}
              className="mt-1.5 font-inter text-[11px] italic text-ink-soft hover:text-terracotta transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function formatEventDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
