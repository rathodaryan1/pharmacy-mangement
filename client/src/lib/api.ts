const API_BASE = "";

function getToken(): string | null {
  return localStorage.getItem("pharmacy_token");
}

export function setToken(token: string) {
  localStorage.setItem("pharmacy_token", token);
}

export function clearToken() {
  localStorage.removeItem("pharmacy_token");
}

export async function apiFetch(
  path: string,
  options: RequestInit & { data?: unknown } = {}
): Promise<Response> {
  const { data, ...init } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...init,
    headers,
    body: data !== undefined ? JSON.stringify(data) : init.body,
    credentials: "include",
  });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const raw = await res.text();
    let message = raw || `${res.status}`;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed?.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "POST", data });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "PUT", data });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || "Request failed");
  }
}
