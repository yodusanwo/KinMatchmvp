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
      className="kin-halftone fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t-2 border-t-black bg-carbon px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
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
                  "relative flex flex-col items-center gap-1 px-1 py-1 min-[360px]:px-2",
                  active ? "text-signal" : "text-nav-gold/70"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5 min-[360px]:h-5 min-[360px]:w-5" strokeWidth={2} aria-hidden />
                <span className="font-pixel text-[13px] uppercase leading-none tracking-[0.5px]">{label}</span>
                {label === "Held" && heldBadge && (
                  <span
                    className="absolute right-0 top-0 h-2 w-2 rounded-full bg-signal"
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
