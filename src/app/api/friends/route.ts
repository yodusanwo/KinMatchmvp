import { NextRequest, NextResponse } from "next/server";
import type { FriendSummary } from "@/lib/api/types";
import { CATEGORY_CADENCE_DAYS, isFriendCategory } from "@/lib/friends/categories";
import { daysQuiet, isDrifting } from "@/lib/friends/utils";
import { randomAvatarColor } from "@/lib/onboarding/avatar-colors";
import type { AvatarColor } from "@/lib/onboarding/types";
import { formatPersonName } from "@/lib/names/format";
import {
  isLikelyInvalidPhone,
  normalizePhone,
} from "@/lib/phones/normalize";
import { createClient } from "@/lib/supabase/server";

type FriendInsertRow = {
  id: string;
  name: string;
  phone_number: string | null;
  avatar_color: AvatarColor;
  avatar_color_hex: string | null;
  avatar_initials: string | null;
  vibe: string;
  category: FriendSummary["category"];
  cadence_days: number;
  last_touch_at: string | null;
  created_at: string;
};

type FriendListRow = FriendInsertRow & {
  archived_at: string | null;
};

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toSummary(friend: FriendListRow): FriendSummary {
  return {
    id: friend.id,
    name: formatPersonName(friend.name),
    phone_number: friend.phone_number ?? null,
    avatar_color: friend.avatar_color,
    avatar_color_hex: friend.avatar_color_hex ?? null,
    avatar_initials: friend.avatar_initials ?? null,
    vibe: friend.vibe,
    category: friend.category ?? "inner_circle",
    cadence_days: friend.cadence_days,
    days_quiet: daysQuiet(friend),
    is_drifting: isDrifting(friend),
    last_touch_at: friend.last_touch_at,
    archived_at: friend.archived_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("friends")
    .select("id, name, phone_number, avatar_color, avatar_color_hex, avatar_initials, vibe, category, cadence_days, last_touch_at, created_at, archived_at")
    .eq("user_id", user.id)
    .eq("in_tribe", true)
    .order("last_touch_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    friends: ((data ?? []) as FriendListRow[]).map(toSummary),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown; category?: unknown; phone_number?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const name = formatPersonName(body.name);
  let phoneNumber: string | null = null;
  if (typeof body.phone_number === "string" && body.phone_number.trim()) {
    if (isLikelyInvalidPhone(body.phone_number)) {
      return NextResponse.json(
        { error: "That doesn't look like a phone number, try with area code." },
        { status: 400 }
      );
    }
    phoneNumber = normalizePhone(body.phone_number);
  }
  const category = isFriendCategory(body.category)
    ? body.category
    : "inner_circle";
  if (name.length < 3 || name.length > 80) {
    return NextResponse.json(
      { error: "Use a name between 3 and 80 characters." },
      { status: 400 }
    );
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("friends")
    .select("name")
    .eq("user_id", user.id)
    .is("archived_at", null);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const normalizedName = normalizeName(name);
  const alreadyExists = (existingRows ?? []).some(
    (friend) => normalizeName(friend.name) === normalizedName
  );

  if (alreadyExists) {
    return NextResponse.json(
      { error: "Already in your tribe." },
      { status: 409 }
    );
  }

  const { data: friend, error } = await supabase
    .from("friends")
    .insert({
      user_id: user.id,
      name,
      phone_number: phoneNumber,
      avatar_color: randomAvatarColor(),
      vibe: "potential_close",
      category,
      cadence_days: CATEGORY_CADENCE_DAYS[category],
      is_wished_closer: false,
      in_tribe: true,
    })
    .select("id, name, phone_number, avatar_color, avatar_color_hex, avatar_initials, vibe, category, cadence_days, last_touch_at, created_at, archived_at")
    .single<FriendListRow>();

  if (error || !friend) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to add this person." },
      { status: 500 }
    );
  }

  const summary = toSummary(friend);

  return NextResponse.json({ friend: summary }, { status: 201 });
}
