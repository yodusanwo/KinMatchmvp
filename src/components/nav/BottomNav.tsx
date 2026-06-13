"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, HeartHandshake, Home, Mic, Users } from "lucide-react";
import { cn } from "@/lib/cn";

type BottomNavProps = {
  heldBadge?: boolean;
};

const NAV_ITEMS = [
  { href: "/today", label: "Home", icon: Home, match: /^\/today/ },
  {
    href: "/tribe",
    label: "Tribe",
    icon: Users,
    match: /^\/(tribe|friends)/,
  },
  {
    href: "/voice-notes",
    label: "Voice",
    icon: Mic,
    match: /^\/voice-notes/,
  },
  {
    href: "/rituals",
    label: "Rituals",
    icon: CalendarHeart,
    match: /^\/rituals/,
  },
  { href: "/held", label: "Held", icon: HeartHandshake, match: /^\/held/ },
] as const;

export function BottomNav({ heldBadge = false }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-t-black/30 bg-surface-dark px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Main"
    >
      <ul className="flex items-center justify-between">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match.test(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                className={cn(
                  "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-sm px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-active min-[360px]:px-2",
                  active ? "text-nav-active" : "text-nav-inactive"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                <span className="font-sans text-[9.5px] font-semibold uppercase leading-none tracking-[0.08em]">{label}</span>
                {label === "Held" && heldBadge && (
                  <span
                    className="absolute right-0 top-1 h-2 w-2 rounded-full bg-nav-active"
                    aria-label="Held active"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
