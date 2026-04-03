// import axios, { type InternalAxiosRequestConfig } from "axios";
// import { startGlobalLoading, stopGlobalLoading } from "./utility/loadingBus";

// export const BASE_URL = import.meta.env.VITE_BASE_URL;

// export const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
// });

// /** After this many failed refresh calls, stop calling `auth/refresh` on 403 (until reset). */
// const MAX_AUTH_REFRESH_ATTEMPTS = 3;

// let requestCount = 0;
// let failedAuthRefreshAttempts = 0;

// type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

// function isAuthRefreshUrl(
//   config: InternalAxiosRequestConfig | undefined,
// ): boolean {
//   const u = String(config?.url ?? "");
//   return u.includes("auth/refresh");
// }

// /** Call after login so 403 handling can try refresh again. */
// export function resetAuthRefreshAttempts(): void {
//   failedAuthRefreshAttempts = 0;
// }

// // Request Interceptor to Dynamically Set Content-Type
// api.interceptors.request.use(
//   (config) => {
//     requestCount++;
//     startGlobalLoading();
//     if (config.data instanceof FormData) {
//       // Don't set Content-Type for FormData - let browser set it with boundary
//       delete config.headers["Content-Type"];
//     } else {
//       config.headers["Content-Type"] = "application/json";
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// api.interceptors.response.use(
//   async (response) => {
//     requestCount--;
//     if (requestCount === 0) stopGlobalLoading();

//     return response;
//   },
//   async (error) => {
//     requestCount--;
//     if (requestCount === 0) stopGlobalLoading();
//     const originalRequest = error.config as RequestConfigWithRetry | undefined;

//     if (error.response?.status !== 403 || !originalRequest) {
//       return Promise.reject(error);
//     }

//     // Never chain refresh on the refresh endpoint itself (403 here = no more refresh loop)
//     if (isAuthRefreshUrl(originalRequest)) {
//       return Promise.reject(error);
//     }

//     if (originalRequest._retry) {
//       return Promise.reject(error);
//     }

//     if (failedAuthRefreshAttempts >= MAX_AUTH_REFRESH_ATTEMPTS) {
//       return Promise.reject(error);
//     }

//     originalRequest._retry = true;

//     try {
//       await api.post("api/auth/refresh");
//       failedAuthRefreshAttempts = 0;
//       return api(originalRequest);
//     } catch (refreshError) {
//       failedAuthRefreshAttempts += 1;
//       if (import.meta.env.DEV) {
//         console.warn(
//           `Refresh API failed (${failedAuthRefreshAttempts}/${MAX_AUTH_REFRESH_ATTEMPTS}); further 403s will not trigger refresh until reset or reload.`,
//         );
//       }
//       return Promise.reject(refreshError);
//     }
//   },
// );
