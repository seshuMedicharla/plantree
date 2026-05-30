const configuredApiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "";
const API_BASE_URL =
  import.meta.env.PROD && configuredApiBaseUrl.startsWith("http://localhost")
    ? ""
    : configuredApiBaseUrl;
const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: "USER" | "ADMIN";
};

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthUser(): AuthUser | null {
  const value = localStorage.getItem(AUTH_USER_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function clearAuth() {
  setAuthToken(null);
  setAuthUser(null);
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : undefined) ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, "GET");
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, "POST", body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, "DELETE");
}
