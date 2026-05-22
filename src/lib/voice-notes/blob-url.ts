import { hasVercelBlob } from "@/lib/env";

/** Stored URL is a Vercel Blob object (public or private store). */
export function isVercelBlobUrl(url: string): boolean {
  return url.includes("blob.vercel-storage.com");
}

/** Share tokens are base64url; ignore any message text appended by share targets. */
export function normalizeShareToken(rawToken: string): string {
  const decoded = decodeURIComponent(rawToken).trim();
  return decoded.match(/^[A-Za-z0-9_-]+/)?.[0] ?? "";
}

/** Client-safe URL for the public listen page `<audio>` element. */
export function listenPageAudioUrl(
  shareToken: string,
  storedAudioUrl: string
): string {
  if (hasVercelBlob() && isVercelBlobUrl(storedAudioUrl)) {
    return `/api/v/${shareToken}/audio`;
  }
  return storedAudioUrl;
}
