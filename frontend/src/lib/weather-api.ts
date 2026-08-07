import type { GeocodeMatch, LookupRecord, VideoItem } from "./weather-types";

const API_BASE = import.meta.env["VITE_WEATHER_API_BASE"] ?? "http://localhost:8000";

function getUrl(path: string) {
  const base = API_BASE.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // leave generic detail
    }
    throw { status: response.status, detail };
  }
  return response.json() as Promise<T>;
}

export async function startSession(): Promise<number> {
  const res = await fetch(getUrl("/api/sessions"), { method: "POST" });
  const data = await handleResponse<{ session_id: number }>(res);
  return data.session_id;
}

export async function geocodeForward(query: string, limit = 5): Promise<GeocodeMatch[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(getUrl(`/api/geocode?${params.toString()}`));
  const data = await handleResponse<{ matches: GeocodeMatch[] }>(res);
  return data.matches;
}

export async function geocodeReverse(lat: number, lon: number): Promise<GeocodeMatch[]> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const res = await fetch(getUrl(`/api/geocode/reverse?${params.toString()}`));
  const data = await handleResponse<{ matches: GeocodeMatch[] }>(res);
  return data.matches;
}

export type CreateLookupInput = {
  session_id: number;
  raw_query: string;
  start_date: string;
  end_date: string;
  chosen_location?: GeocodeMatch | null;
  notes?: string | null;
};

export async function createLookup(input: CreateLookupInput): Promise<number> {
  const res = await fetch(getUrl("/api/lookups"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ lookup_id: number }>(res);
  return data.lookup_id;
}

export async function getLookup(id: number): Promise<LookupRecord> {
  const res = await fetch(getUrl(`/api/lookups/${id}`));
  return handleResponse<LookupRecord>(res);
}

export async function listLookups(): Promise<LookupRecord[]> {
  const res = await fetch(getUrl("/api/lookups"));
  const data = await handleResponse<{ lookups: LookupRecord[] }>(res);
  return data.lookups;
}

export type UpdateLookupInput = {
  start_date: string;
  end_date: string;
  notes?: string | null;
  raw_query?: string | null;
  chosen_location?: GeocodeMatch | null;
};

export async function updateLookup(id: number, input: UpdateLookupInput): Promise<LookupRecord> {
  const res = await fetch(getUrl(`/api/lookups/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<LookupRecord>(res);
}

export async function deleteLookup(id: number): Promise<void> {
  const res = await fetch(getUrl(`/api/lookups/${id}`), { method: "DELETE" });
  await handleResponse<{ deleted: true; lookup_id: number }>(res);
}

export async function exportLookupCsv(id: number, sessionId: number): Promise<Blob> {
  const params = new URLSearchParams({ session_id: String(sessionId), format: "csv" });
  const res = await fetch(getUrl(`/api/lookups/${id}/export?${params.toString()}`));
  if (!res.ok) {
    let detail = `Export failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // leave generic detail
    }
    throw { status: res.status, detail };
  }
  return res.blob();
}

export async function getLookupVideos(id: number): Promise<VideoItem[]> {
  const res = await fetch(getUrl(`/api/lookups/${id}/videos`));
  const data = await handleResponse<{ videos: VideoItem[] }>(res);
  return data.videos;
}
