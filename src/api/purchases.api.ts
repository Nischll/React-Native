import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import { RevenueDetailItem, RevenueDetailType } from "../types/revenueDetail.types";

export type PurchaseType = Extract<
  RevenueDetailType,
  "FILTER" | "RENTAL" | "ACCESS_DEVICE" | "VISITOR_PASS" | "ENTERPHONE"
>;

export interface PurchaseQueryParams {
  page?: number;
  limit?: number;
  buildingId?: number;
  type?: PurchaseType;
  fromDate?: string;
  toDate?: string;
  residentId?: number;
  excludeFree?: boolean;
  isPaid?: boolean;
}

export const useGetPurchases = (
  params: PurchaseQueryParams = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponseArray<RevenueDetailItem> | ApiPaginatedData<RevenueDetailItem>
  >("/purchases", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};
