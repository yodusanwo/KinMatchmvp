import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "name",
  "daily_checkin_enabled",
  "sunday_voice_drop_enabled",
  "held_alerts_enabled",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];
type ProfileUpdate = Partial<Record<AllowedField, string | boolean | null>>;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: ProfileUpdate = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;
    const value = body[key];

    if (key === "name") {
      if (value !== null && typeof value !== "string") {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = typeof value === "string" ? value.trim() || null : null;
      continue;
    }

    if (typeof value !== "boolean") {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400 }
      );
    }
    updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
