import { put } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasVercelBlob } from "@/lib/env";

const BUCKET = "voice-notes";

export async function uploadVoiceAudio(
  userId: string,
  voiceNoteId: string,
  audio: Blob,
  contentType: string
): Promise<string> {
  const extension = contentType.includes("mp4")
    ? "mp4"
    : contentType.includes("mpeg")
      ? "mp3"
      : contentType.includes("ogg")
        ? "ogg"
        : "webm";
  const pathname = `${userId}/${voiceNoteId}.${extension}`;

  if (hasVercelBlob()) {
    const blob = await put(pathname, audio, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const admin = createAdminClient();
  const buffer = Buffer.from(await audio.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(pathname, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(pathname);
  return data.publicUrl;
}
