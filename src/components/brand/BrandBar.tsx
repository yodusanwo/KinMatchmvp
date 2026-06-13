"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

type BrandBarProps = {
  className?: string;
};

export function BrandBar({ className }: BrandBarProps) {
  const [href, setHref] = useState("/signin");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setHref(user ? "/profile" : "/signin");
    });
  }, []);

  const label = href === "/profile" ? "Your profile" : "Sign in";

  return (
    <>
      <header
        className={cn(
          "kin-halftone flex items-center justify-between border-b-2 border-b-black bg-carbon px-5 py-3",
          className
        )}
      >
        {/* Menu button on left */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-xs text-nav-gold hover:bg-white/10"
          aria-label="Menu"
        >
          {menuOpen ? (
            <X className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={2} />
          )}
        </button>

        {/* Logo/Profile on right */}
        <Link
          href={href}
          className="flex items-center gap-2 rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          aria-label={label}
        >
          <span className="font-display text-base uppercase tracking-[0.5px]">
            <span className="text-white">Kin</span>
            <span className="text-signal">Match</span>
          </span>
          <BrandMark size={24} />
        </Link>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/20"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <nav className="fixed left-0 top-0 z-50 h-full w-64 bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.12] px-5 py-4">
              <span className="font-sans text-sm font-medium uppercase tracking-[0.12em] text-ink-soft">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-ink/[0.05]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            
            <div className="p-4">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-sans text-base font-medium text-ink hover:bg-ink/[0.05]"
              >
                <LayoutDashboard className="h-5 w-5" strokeWidth={1.75} />
                Dashboard
              </Link>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
