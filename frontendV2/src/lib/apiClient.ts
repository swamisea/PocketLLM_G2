// src/lib/apiClient.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function getTokenFromCookie(cookieName = "pll_token"): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp("(^|;\\s*)(" + cookieName + ")=([^;]*)")
  );

  return match ? decodeURIComponent(match[3]) : null;
}

export const apiClient = axios.create({
  baseURL: API_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie("pll_token"); // <-- your cookie name

    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export type ApiClient = typeof apiClient;
