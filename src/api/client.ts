import { BASE_URL } from "@/src/constants/env";
import axios, { InternalAxiosRequestConfig } from "axios";
import { ENABLE_DEBUG_LOGS } from "../utils/debug";
import { startGlobalLoading, stopGlobalLoading } from "../utils/loadingBus";

export const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const MAX_AUTH_REFRESH_ATTEMPTS = 3;

let requestCount = 0;
let failedAuthRefreshAttempts = 0;

type RequestConfigWithRetry = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function isAuthRefreshUrl(
  config: InternalAxiosRequestConfig | undefined,
): boolean {
  const u = String(config?.url ?? "");
  return u.includes("auth/refresh");
}

function increaseRequestCount() {
  requestCount += 1;
  startGlobalLoading();
}

function decreaseRequestCount() {
  requestCount = Math.max(0, requestCount - 1);
  if (requestCount === 0) {
    stopGlobalLoading();
  }
}

export function resetAuthRefreshAttempts(): void {
  failedAuthRefreshAttempts = 0;

  if (ENABLE_DEBUG_LOGS) {
    console.log("♻️ RESET AUTH REFRESH ATTEMPTS");
  }
}

// ------------------- Request Interceptor -------------------
apiService.interceptors.request.use(
  async (config) => {
    increaseRequestCount();

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    if (ENABLE_DEBUG_LOGS) {
      console.log("🚀 API REQUEST");
      console.log("➡️ URL:", `${config.baseURL}${config.url}`);
      console.log("➡️ METHOD:", config.method?.toUpperCase());
      console.log("➡️ HEADERS:", config.headers);
      console.log("➡️ PARAMS:", config.params);
      console.log("➡️ DATA:", config.data);
      console.log("➡️ WITH CREDENTIALS:", config.withCredentials);
      console.log("➡️ REQUEST COUNT:", requestCount);
    }

    return config;
  },
  (error) => {
    decreaseRequestCount();

    if (ENABLE_DEBUG_LOGS) {
      console.log("❌ REQUEST SETUP ERROR", error);
    }

    return Promise.reject(error);
  },
);

// ------------------- Response Interceptor -------------------
apiService.interceptors.response.use(
  async (response) => {
    decreaseRequestCount();

    if (ENABLE_DEBUG_LOGS) {
      console.log("✅ API RESPONSE");
      console.log("⬅️ URL:", response.config.url);
      console.log("⬅️ STATUS:", response.status);
      console.log("⬅️ DATA:", response.data);
      console.log("⬅️ REQUEST COUNT:", requestCount);
    }

    return response;
  },
  async (error) => {
    decreaseRequestCount();

    if (ENABLE_DEBUG_LOGS) {
      console.log("❌ API ERROR");
      console.log("⬅️ URL:", error?.config?.url);
      console.log("⬅️ STATUS:", error?.response?.status);
      console.log("⬅️ RESPONSE DATA:", error?.response?.data);
      console.log("⬅️ MESSAGE:", error?.message);
      console.log("⬅️ REQUEST COUNT:", requestCount);
    }

    const originalRequest = error.config as RequestConfigWithRetry | undefined;

    // If not auth-related or config missing
    if (error.response?.status !== 403 || !originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite refresh loop
    if (isAuthRefreshUrl(originalRequest) || originalRequest._retry) {
      if (ENABLE_DEBUG_LOGS) {
        console.log("⛔ REFRESH LOOP BLOCKED");
      }
      return Promise.reject(error);
    }

    if (failedAuthRefreshAttempts >= MAX_AUTH_REFRESH_ATTEMPTS) {
      if (ENABLE_DEBUG_LOGS) {
        console.log("⛔ MAX REFRESH ATTEMPTS REACHED");
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (ENABLE_DEBUG_LOGS) {
        console.log("🔄 TRYING AUTH REFRESH...");
      }

      await apiService.post("/api/auth/refresh");

      failedAuthRefreshAttempts = 0;

      if (ENABLE_DEBUG_LOGS) {
        console.log("✅ AUTH REFRESH SUCCESS");
        console.log("🔁 RETRYING ORIGINAL REQUEST:", originalRequest.url);
      }

      return apiService(originalRequest);
    } catch (refreshError) {
      failedAuthRefreshAttempts += 1;

      console.warn(
        `Refresh failed (${failedAuthRefreshAttempts}/${MAX_AUTH_REFRESH_ATTEMPTS})`,
      );

      if (ENABLE_DEBUG_LOGS) {
        console.log("❌ AUTH REFRESH FAILED", refreshError);
      }

      return Promise.reject(refreshError);
    }
  },
);
