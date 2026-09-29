export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
export const API_ORIGIN = new URL(API).origin;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(API + path, {
    credentials: "include",
    ...rest,
    headers: { ...(json !== undefined && { "content-type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? res.statusText, res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type Me = { id: string; email: string; name: string };
export type Video = {
  id: string; title: string; status: "QUEUED" | "PROCESSING" | "READY" | "FAILED"; progress: number;
  durationSec: number | null; width: number | null; height: number | null; renditions: string[];
  hasSubtitles: boolean; errorMessage: string | null; createdAt: string;
};
export type RoomInfo = {
  code: string; controlMode: "HOST_ONLY" | "EVERYONE"; host: { id: string; name: string };
  video: { id: string; title: string; status: Video["status"]; renditions: string[]; hasSubtitles: boolean };
  memberCount: number;
};
