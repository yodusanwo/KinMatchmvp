const ACTIONS = ["Text", "Call", "Plan"] as const;

export function ActionRow() {
  return (
    <div className="flex gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action}
          type="button"
          className="flex-1 rounded-full border border-ink/[0.35] py-2.5 font-sans text-xs font-medium text-ink transition-colors hover:border-terracotta/50 hover:bg-cream-deep/50"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
