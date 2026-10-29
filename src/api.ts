export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Photo and file URLs from the API are root-relative. The portal host does not serve them. */
export function mediaUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(`${base}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/** Refresh the session, then open a file on the API host so the browser can download it. */
export async function openDownload(path: string) {
  await refreshSession();
  window.location.assign(mediaUrl(path));
}

/** Fetch a private file as a blob URL so it can be shown in the portal. */
export async function fetchAuthenticatedBlob(path: string): Promise<string> {
  await refreshSession();
  const res = await fetch(mediaUrl(path), { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Could not load that file");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!isForm && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const request = () =>
    fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });

  let res = await request();
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    const ok = await refreshSession();
    if (ok) res = await request();
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      res.status === 429
        ? "Too many requests. Wait a few seconds and try again."
        : data.error || "Something went wrong";
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const websiteUrl = (import.meta.env.VITE_WEBSITE_URL ?? "http://localhost:5175").replace(/\/$/, "");

export type ServiceId = "diy" | "personalized";

export function track(name: "checkout_start" | "checkout_cancel", service?: ServiceId) {
  void fetch(`${base}/api/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, path: window.location.pathname, service }),
  }).catch(() => undefined);
}
