import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { Employee, RoleApiResponse } from "../types/employee.types";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetStaff = (page?: number, limit?: number, searchQuery?: string) => {
  const queryParams: Record<string, any> = {};
  if (page !== undefined) queryParams.page = page;
  if (limit !== undefined) queryParams.limit = limit;
  if (searchQuery !== undefined && searchQuery.trim() !== "") queryParams.search = searchQuery.trim();
  return useApiQuery<ApiListResponse<ApiPaginatedData<Employee>>>("/auth/get-user", {
    retry: 0,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetStaffByBuilding = (id: number | null) =>
  useApiQuery<ApiListResponseArray<Employee>>(`/auth/user/building/${id}`, { retry: 0, enabled: id != null });

export const useGetActiveRoles = () =>
  useApiQuery<ApiListResponseArray<RoleApiResponse>>("/auth/get-active-roles", { retry: 0 });

export const useAddStaff = () =>
  useApiMutation<FormData>("post", "/auth/add-user");
export const useUpdateStaff = (id: number | undefined) =>
  useApiMutation<FormData>("put", `/auth/update-user/${id}`);
export const useToggleStaffStatus = (userId: number | undefined) =>
  useApiMutation("put", `/auth/toggle-staff-status/${userId}`, {
    showSuccessToast: false,
  });
