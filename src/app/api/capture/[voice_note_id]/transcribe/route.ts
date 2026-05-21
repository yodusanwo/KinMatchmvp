import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ voice_note_id: string }> };

function filenameForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "capture-recap.mp4";
  if (mimeType.includes("mpeg")) return "capture-recap.mp3";
  if (mimeType.includes("ogg")) return "capture-recap.ogg";
  return "capture-recap.webm";
}

export async function POST(request: Request, context: RouteContext) {
  const { voice_note_id: voiceNoteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Voice transcription is not configured yet." },
      { status: 503 }
    );
  }

  const { data: voiceNote } = await supabase
    .from("voice_notes")
    .select("id")
    .eq("id", voiceNoteId)
    .eq("sender_id", user.id)
    .maybeSingle();

  if (!voiceNote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  const mimeTypeRaw = formData.get("mime_type");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Audio is required" }, { status: 400 });
  }

  const mimeType =
    typeof mimeTypeRaw === "string" && mimeTypeRaw.trim()
      ? mimeTypeRaw.trim()
      : audio.type || "audio/webm";

  const whisperForm = new FormData();
  whisperForm.append(
    "file",
    audio,
    filenameForMimeType(mimeType)
  );
  whisperForm.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: whisperForm,
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Could not transcribe recording." },
      { status: 500 }
    );
  }

  const data = (await response.json()) as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
