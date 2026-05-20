import { createClient } from "@/lib/supabase/server";
import { loadPendingCapturePrompts } from "@/lib/capture/pending";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompts, error } = await loadPendingCapturePrompts(supabase, user.id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ prompts });
}
