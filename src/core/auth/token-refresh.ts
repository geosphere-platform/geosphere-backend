/**
 * Token Refresh Manager
 *
 * Silently refreshes the access token before it expires using the
 * HttpOnly refresh token cookie at /api/v1/auth/refresh.
 *
 * Usage: Call `startTokenRefresh()` once after login.
 * The manager will automatically refresh every 14 minutes (token lifetime = 15 min).
 */

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

let refreshTimer: ReturnType<typeof setInterval> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include", // sends HttpOnly refresh token cookie
    });

    if (!res.ok) {
      console.warn("[Auth] Token refresh failed with status:", res.status);
      stopTokenRefresh();
      // Redirect to login on 401
      if (res.status === 401) {
        window.location.assign("/login");
      }
      return null;
    }

    const json = await res.json();
    if (!json.success || !json.data?.accessToken) {
      return null;
    }

    const newToken = json.data.accessToken;

    // Update localStorage and document cookie
    localStorage.setItem("gis_access_token", newToken);
    document.cookie = `gis_access_token=${newToken}; path=/; max-age=900; SameSite=Lax`;

    console.debug("[Auth] Token refreshed successfully");
    return newToken;
  } catch (err) {
    console.warn("[Auth] Token refresh error:", err);
    return null;
  }
}

export function startTokenRefresh(): void {
  if (typeof window === "undefined") return;

  // Stop any existing timer first
  stopTokenRefresh();

  refreshTimer = setInterval(async () => {
    await performTokenRefresh();
  }, REFRESH_INTERVAL_MS);

  console.debug("[Auth] Token refresh timer started (every 14 min)");
}

export function stopTokenRefresh(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.debug("[Auth] Token refresh timer stopped");
  }
}

export { performTokenRefresh };
