import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { LoginType, UserData } from "../types/auth.types";

export type ApiListResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export type ApiListResponseArray<T> = {
  statusCode: number;
  message: string;
  data: T[];
};

export type ApiPaginatedData<T> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

export const useGetInit = () => {
  return useApiQuery<ApiListResponse<UserData>>("/auth/init", {
    retry: 0,
    refetchOnMount: true,
    // refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useLoginMutation = () => {
  return useApiMutation<LoginType>("post", "/auth/login", {
    showSuccessToast: true,
  });
};

export const useLogoutMutation = () => {
  return useApiMutation("post", "/auth/logout", {
    showSuccessToast: true,
  });
};
