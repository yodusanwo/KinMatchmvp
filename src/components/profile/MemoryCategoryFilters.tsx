"use client";

import type { MemoryCategory } from "@/lib/api/types";
import { MEMORY_CATEGORIES } from "@/lib/memories/categories";
import { cn } from "@/lib/cn";

type MemoryCategoryFiltersProps = {
  categories: MemoryCategory[];
  memoryCounts: Record<MemoryCategory, number>;
  activeFilters: Set<MemoryCategory>;
  onFilterChange: (filters: Set<MemoryCategory>) => void;
};

export function MemoryCategoryFilters({
  categories,
  memoryCounts,
  activeFilters,
  onFilterChange,
}: MemoryCategoryFiltersProps) {
  const totalCount = categories.reduce(
    (sum, cat) => sum + memoryCounts[cat],
    0
  );

  const isAllActive = activeFilters.size === 0;

  const handleAllClick = () => {
    onFilterChange(new Set());
  };

  const handleCategoryClick = (category: MemoryCategory) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="relative -mx-5 px-5">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          <button
            type="button"
            onClick={handleAllClick}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-xs font-medium transition-colors",
              isAllActive
                ? "border-ink bg-ink text-white"
                : "border-hairline bg-cream text-ink-soft hover:border-ink hover:text-ink"
            )}
          >
            <span>All</span>
            <span className="text-[12px] opacity-70">({totalCount})</span>
          </button>

          {categories.map((categoryId) => {
            const config = MEMORY_CATEGORIES[categoryId];
            const Icon = config.icon;
            const count = memoryCounts[categoryId];
            const isActive = activeFilters.has(categoryId);

            return (
              <button
                key={categoryId}
                type="button"
                onClick={() => handleCategoryClick(categoryId)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-xs font-medium transition-colors",
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-hairline bg-cream text-ink-soft hover:border-ink hover:text-ink"
                )}
              >
                <Icon
                  className="h-3 w-3"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{config.chipLabel}</span>
                <span className="text-[12px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
