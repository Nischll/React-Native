import { useApiQuery } from "../hooks/api/useApiQuery";
import { Employee } from "../types/employee.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetStaff = (
  page?: number,
  limit?: number,
  searchQuery?: string,
) => {
  const queryParams: Record<string, any> = {};
  if (page !== undefined) queryParams.page = page;
  if (limit !== undefined) queryParams.limit = limit;
  if (searchQuery !== undefined && searchQuery.trim() !== "") {
    queryParams.search = searchQuery.trim();
  }

  return useApiQuery<ApiListResponse<ApiPaginatedData<Employee>>>(
    "/auth/get-user",
    {
      retry: 0,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
};
