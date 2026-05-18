export const REACHABILITY_ERROR =
  "Couldn't reach KinMatch. Try again in a moment.";

export type FetchJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = (body as { error?: string }).error;
      return {
        ok: false,
        error: message ?? REACHABILITY_ERROR,
        status: res.status,
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, error: REACHABILITY_ERROR, status: 0 };
  }
}
