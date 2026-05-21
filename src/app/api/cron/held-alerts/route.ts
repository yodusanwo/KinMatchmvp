import { NextRequest, NextResponse } from "next/server";
import { sendHeldAlertEmail } from "@/lib/klaviyo/send-held-alert";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

type HeldAlertRow = {
  id: string;
  holder_user_id: string;
  threshold_days: number;
  last_alert_fired_at: string | null;
  friend:
    | {
        id: string;
        name: string;
        email: string | null;
        last_touch_at: string | null;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        email: string | null;
        last_touch_at: string | null;
        created_at: string;
      }[]
    | null;
  holder:
    | { name: string | null; email: string | null; held_alerts_enabled: boolean | null }
    | { name: string | null; email: string | null; held_alerts_enabled: boolean | null }[]
    | null;
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function firstRow<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: rows, error } = await admin
    .from("held_relationships")
    .select(
      `
      id,
      holder_user_id,
      threshold_days,
      last_alert_fired_at,
      friend:friends!held_relationships_held_friend_id_fkey (
        id,
        name,
        email,
        last_touch_at,
        created_at
      ),
      holder:users!held_relationships_holder_user_id_fkey (
        name,
        email,
        held_alerts_enabled
      )
    `
    )
    .eq("status", "active")
    .not("held_friend_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = {
    checked: 0,
    sent: 0,
    skippedDisabled: 0,
    skippedNoEmail: 0,
    skippedNotDue: 0,
    skippedAlreadySent: 0,
    failed: 0,
  };

  for (const row of (rows ?? []) as HeldAlertRow[]) {
    summary.checked += 1;

    const friend = firstRow(row.friend);
    const holder = firstRow(row.holder);

    if (holder?.held_alerts_enabled === false) {
      summary.skippedDisabled += 1;
      continue;
    }

    if (!friend?.email) {
      summary.skippedNoEmail += 1;
      continue;
    }

    const quietSince = new Date(friend.last_touch_at ?? friend.created_at);
    const daysQuiet = Math.floor((now.getTime() - quietSince.getTime()) / DAY_MS);

    if (daysQuiet < row.threshold_days) {
      summary.skippedNotDue += 1;
      continue;
    }

    const thresholdCrossedAt = new Date(
      quietSince.getTime() + row.threshold_days * DAY_MS
    );
    const lastAlertAt = row.last_alert_fired_at
      ? new Date(row.last_alert_fired_at)
      : null;

    if (lastAlertAt && lastAlertAt >= thresholdCrossedAt) {
      summary.skippedAlreadySent += 1;
      continue;
    }

    const userName =
      holder?.name?.trim() || holder?.email?.split("@")[0] || "Someone";

    const result = await sendHeldAlertEmail({
      holderUserId: row.holder_user_id,
      recipientEmail: friend.email,
      holderName: friend.name,
      userName,
      daysQuiet,
      thresholdDays: row.threshold_days,
    });

    if (!result.sent) {
      if (result.skipped) {
        summary.skippedDisabled += 1;
      } else {
        summary.failed += 1;
      }
      continue;
    }

    const occurredAt = now.toISOString();
    const { error: updateError } = await admin
      .from("held_relationships")
      .update({ last_alert_fired_at: occurredAt })
      .eq("id", row.id);

    const { error: eventError } = await admin.from("held_events").insert({
      held_relationship_id: row.id,
      event_type: "alert_fired",
      occurred_at: occurredAt,
    });

    if (updateError || eventError) {
      summary.failed += 1;
      continue;
    }

    summary.sent += 1;
  }

  return NextResponse.json(summary);
}
