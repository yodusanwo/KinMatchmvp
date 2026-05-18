"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

type BrandBarProps = {
  className?: string;
};

export function BrandBar({ className }: BrandBarProps) {
  const [href, setHref] = useState("/signin");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setHref(user ? "/profile" : "/signin");
    });
  }, []);

  const label = href === "/profile" ? "Your profile" : "Sign in";

  return (
    <header
      className={cn(
        "flex items-center justify-end border-b border-ink/[0.12] px-5 py-4",
        className
      )}
    >
      <Link
        href={href}
        className="flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        aria-label={label}
      >
        <span className="font-inter text-lg italic text-ink">KinMatch</span>
        <BrandMark size={24} />
      </Link>
    </header>
  );
}
