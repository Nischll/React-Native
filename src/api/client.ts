import { BASE_URL } from "@/src/constants/env";
import axios, { InternalAxiosRequestConfig } from "axios";
import { startGlobalLoading, stopGlobalLoading } from "../utils/loadingBus";

export const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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

export function resetAuthRefreshAttempts(): void {
  failedAuthRefreshAttempts = 0;
}

apiService.interceptors.request.use(
  async (config) => {
    requestCount++;
    startGlobalLoading();

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    // OPTIONAL: attach token if using JWT in storage
    // const token = await AsyncStorage.getItem("accessToken");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiService.interceptors.response.use(
  async (response) => {
    requestCount--;
    if (requestCount === 0) stopGlobalLoading();
    return response;
  },
  async (error) => {
    requestCount--;
    if (requestCount === 0) stopGlobalLoading();

    const originalRequest = error.config as RequestConfigWithRetry | undefined;

    if (error.response?.status !== 403 || !originalRequest) {
      return Promise.reject(error);
    }

    if (isAuthRefreshUrl(originalRequest)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (failedAuthRefreshAttempts >= MAX_AUTH_REFRESH_ATTEMPTS) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await apiService.post("/api/auth/refresh");
      failedAuthRefreshAttempts = 0;
      return apiService(originalRequest);
    } catch (refreshError) {
      failedAuthRefreshAttempts += 1;
      console.warn(
        `Refresh failed (${failedAuthRefreshAttempts}/${MAX_AUTH_REFRESH_ATTEMPTS})`,
      );
      return Promise.reject(refreshError);
    }
  },
);
