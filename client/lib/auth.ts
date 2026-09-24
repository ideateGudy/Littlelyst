/**
 * Clean In-Memory Auth & Session Observer.
 * Strictly NO tokens, keys, or sensitive credentials stored in localStorage/sessionStorage.
 * Session state is maintained securely on the server via httpOnly express-session cookie.
 */

const listeners: Set<(loggedIn: boolean) => void> = new Set();

export const authStore = {
  isLoggedIn(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("littlelyst_logged_in=1");
  },

  setLoggedInMarker(active: boolean) {
    if (typeof document !== "undefined") {
      if (active) {
        document.cookie = `littlelyst_logged_in=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } else {
        document.cookie = "littlelyst_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    }
    listeners.forEach((listener) => listener(active));
  },

  clearSession() {
    this.setLoggedInMarker(false);
  },

  subscribe(listener: (loggedIn: boolean) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
