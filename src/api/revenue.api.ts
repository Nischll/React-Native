import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import {
  RevenueDetailItem,
  RevenueDetailQueryParams,
  RevenueDetailUpdateRequest,
} from "../types/revenueDetail.types";

export const useGetRevenueDetails = (
  params: RevenueDetailQueryParams = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponseArray<RevenueDetailItem> | ApiPaginatedData<RevenueDetailItem>
  >("/revenue-detail", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useUpdateRevenueDetail = (id?: number) =>
  useApiMutation<RevenueDetailUpdateRequest>("put", `/revenue-detail/${id}`);
