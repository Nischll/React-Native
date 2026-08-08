import { apiService } from "@/src/api/client";
import { showToast } from "@/src/utils/toast";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

interface SuccessResponse<T = any> {
  message: string;
  data?: T;
}

type ResponseMode = "json" | "blob" | "arraybuffer";

interface UseApiMutationOptions {
  params?: Record<string, any>;
  responseType?: ResponseMode;
  successMessage?: string;
  showSuccessToast?: boolean;
}

export function useApiMutation<TBody = any, TJsonData = any, TPathVars = any>(
  method: "post" | "put" | "patch" | "delete",
  endpoint: string | ((pathVars?: TPathVars) => string),
  options?: UseApiMutationOptions,
) {
  const { params, responseType = "json" } = options ?? {};

  const buildConfig = (): AxiosRequestConfig => {
    if (responseType === "blob" || responseType === "arraybuffer") {
      return { params, responseType: responseType as "blob" | "arraybuffer" };
    }
    return { params };
  };

  return useMutation<
    AxiosResponse<any>,
    AxiosError,
    TBody & { pathVars?: TPathVars }
  >({
    mutationKey: [method, endpoint, params, responseType],
    mutationFn: (data) => {
      const cfg = buildConfig();

      // FormData must be sent as-is (do not Object.entries / strip pathVars).
      // Wrapper `{ formData, pathVars }` lets multipart use function endpoints (e.g. access-device).
      const isWrappedFormData =
        data != null &&
        typeof data === "object" &&
        !(data instanceof FormData) &&
        "formData" in (data as object) &&
        ((data as any).formData instanceof FormData ||
          (typeof (data as any).formData === "object" &&
            "_parts" in (data as any).formData));

      const isFormData =
        !isWrappedFormData &&
        typeof FormData !== "undefined" &&
        data != null &&
        (data instanceof FormData ||
          (typeof data === "object" && "_parts" in (data as object)));

      if (isFormData || isWrappedFormData) {
        const formBody = isWrappedFormData
          ? (data as any).formData
          : data;
        const pathVars = isWrappedFormData
          ? (data as any).pathVars
          : undefined;
        const url =
          typeof endpoint === "function"
            ? endpoint(pathVars as TPathVars | undefined)
            : endpoint;
        const formCfg: AxiosRequestConfig = {
          ...cfg,
          transformRequest: [(body) => body],
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          headers: {
            ...(cfg.headers as object),
            "Content-Type": false as any,
          },
        };
        switch (method) {
          case "post":
            return apiService.post(url, formBody, formCfg);
          case "put":
            return apiService.put(url, formBody, formCfg);
          case "patch":
            return apiService.patch(url, formBody, formCfg);
          case "delete":
            return apiService.delete(url, formCfg);
          default:
            throw new Error("Unsupported method");
        }
      }

      const pathVars =
        data && typeof data === "object" ? (data.pathVars ?? data) : undefined;

      const url =
        typeof endpoint === "function"
          ? endpoint(pathVars as TPathVars | undefined)
          : endpoint;

      const body =
        typeof endpoint === "function" && data && typeof data === "object"
          ? Object.fromEntries(
              Object.entries(data).filter(([key]) => key !== "pathVars"),
            )
          : data;

      switch (method) {
        case "post":
          return apiService.post(url, body, cfg);
        case "put":
          return apiService.put(url, body, cfg);
        case "patch":
          return apiService.patch(url, body ?? {}, cfg);
        case "delete":
          if (typeof endpoint === "string" && (data as any)?.id) {
            return apiService.delete(`${url}/${(data as any).id}`, cfg);
          }
          return apiService.delete(url, cfg);
        default:
          throw new Error("Unsupported method");
      }
    },
    onSuccess: (response) => {
      if (responseType === "json" && options?.showSuccessToast !== false) {
        const res = response.data as SuccessResponse<TJsonData> | undefined;
        showToast(
          "success",
          options?.successMessage ?? res?.message ?? "Operation successful",
        );
      }
    },
    onError: (error) => {
      const msg =
        (error?.response?.data as any)?.message ??
        error.message ??
        "Something went wrong";

      showToast("error", msg);
    },
  });
}
