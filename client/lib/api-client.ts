export interface ApiResponse<T = any> {
  status: "success" | "error" | "failed";
  message?: string;
  data?: T;
  user?: any;
  [key: string]: any;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Fetch client configured for express-session cookie authentication (credentials: 'include').
 * Transmits httpOnly express-session cookie (littlelyst.sid) with zero client-side token exposure.
 */
// Track ongoing refresh promise so concurrent requests deduplicate on the same refresh
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Always transmit express-session & jwt httpOnly cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    let response = await fetch(url, config);

    // If 401 or 403 (expired access token or fresh server boot), attempt transparent refresh
    const isAuthRoute =
      endpoint.includes("/api/auth/login") ||
      endpoint.includes("/api/auth/register") ||
      endpoint.includes("/api/auth/refresh") ||
      endpoint.includes("/api/auth/logout");

    if ((response.status === 401 || response.status === 403) && !isAuthRoute) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry initial request once with renewed session cookies
        response = await fetch(url, config);
      }
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({
      status: response.ok ? "success" : "error",
      message: response.statusText,
    }));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}
