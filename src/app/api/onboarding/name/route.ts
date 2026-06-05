import { formatPersonName } from "@/lib/names/format";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const name = formatPersonName(body.name);
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Use at least 2 characters." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .upsert(
      { 
        id: user.id, 
        name, 
        email: user.email ?? undefined 
      },
      { 
        onConflict: "id",
        ignoreDuplicates: false 
      }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name });
}
