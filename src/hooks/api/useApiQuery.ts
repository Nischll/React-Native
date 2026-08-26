import { apiService } from "@/src/api/client";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosRequestConfig } from "axios";

interface UseApiQueryConfig<TData = unknown> {
  queryParams?: Record<string, any>;
  enabled?: boolean;
  axiosConfig?: AxiosRequestConfig & { skipGlobalLoading?: boolean };
  responseType?: AxiosRequestConfig["responseType"];
  staleTime?: number;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean;
  refetchInterval?: number | false;
  select?: UseQueryOptions<TData, Error>["select"];
  retry?: UseQueryOptions<TData, Error>["retry"];
}

export const useApiQuery = <T>(
  endpoint: string | string[],
  config?: UseApiQueryConfig<T>,
) => {
  const {
    queryParams,
    enabled = true,
    axiosConfig,
    responseType,
    staleTime = 0,
    refetchOnMount = true,
    refetchOnReconnect = true,
    refetchInterval,
    select,
    retry,
  } = config || {};

  const queryKey = queryParams
    ? [
        Array.isArray(endpoint) ? endpoint[0] : endpoint,
        JSON.stringify(queryParams),
      ]
    : [Array.isArray(endpoint) ? endpoint[0] : endpoint];

  const options: UseQueryOptions<T, Error, T, typeof queryKey> = {
    queryKey,
    enabled,
    staleTime,
    refetchOnMount,
    refetchOnReconnect,
    refetchInterval,
    select,
    retry,
    queryFn: async () => {
      const finalAxiosConfig: AxiosRequestConfig = {
        ...(axiosConfig || {}),
        ...(responseType ? { responseType } : {}),
        params: queryParams,
      };

      const response = await apiService.get<T>(
        Array.isArray(endpoint) ? endpoint[0] : endpoint,
        finalAxiosConfig,
      );

      return response.data;
    },
  };

  return useQuery(options);
};
