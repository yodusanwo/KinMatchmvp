import { get } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVercelBlobUrl } from "@/lib/voice-notes/blob-url";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ shareToken: string }> };

/** Streams private Vercel Blob audio for a valid share link (no auth). */
export async function GET(_request: Request, context: RouteContext) {
  const { shareToken } = await context.params;

  if (!shareToken || shareToken.length < 8) {
    return new NextResponse(null, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: voiceNote } = await admin
    .from("voice_notes")
    .select("audio_url, mime_type")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (!voiceNote?.audio_url || voiceNote.audio_url === "pending") {
    return new NextResponse(null, { status: 404 });
  }

  const storedUrl = voiceNote.audio_url;

  if (!isVercelBlobUrl(storedUrl)) {
    return NextResponse.redirect(storedUrl, { status: 302 });
  }

  const result = await get(storedUrl, { access: "private" });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Content-Type": result.blob.contentType || "audio/webm",
      ...(result.blob.size ? { "Content-Length": String(result.blob.size) } : {}),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
