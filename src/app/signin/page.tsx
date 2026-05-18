import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SignInForm } from "./sign-in-form";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next ?? "/today");
  }

  return (
    <AppShell>
      <Suspense fallback={<div className="px-5 py-10 text-ink-soft">Loading…</div>}>
        <SignInForm
          authOrigin={getAppOrigin()}
          initialError={error === "auth"}
          nextPath={next ?? "/today"}
        />
      </Suspense>
    </AppShell>
  );
}
