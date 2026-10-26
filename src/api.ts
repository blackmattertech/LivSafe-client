export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const base = import.meta.env.VITE_API_URL ?? "";

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
