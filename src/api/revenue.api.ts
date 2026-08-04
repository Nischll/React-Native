import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import {
  RevenueDetailItem,
  RevenueDetailQueryParams,
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
    | ApiListResponse<ApiPaginatedData<RevenueDetailItem>>
    | ApiListResponseArray<RevenueDetailItem>
  >("/revenue-detail", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

/** Entity updates used by web Revenue Details (not PUT /revenue-detail/:id). */
export const useUpdateBookingRevenue = (bookingId?: number) =>
  useApiMutation<Record<string, any> | FormData>("put", `/booking/${bookingId}`, {
    successMessage: "Revenue updated",
  });

export const useUpdateFilterRevenue = () =>
  useApiMutation(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/filter/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Revenue updated" },
  );

export const useUpdateAccessDeviceRevenue = () =>
  useApiMutation(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/access-device/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Revenue updated" },
  );

export const useUpdateVisitorPassRevenue = () =>
  useApiMutation(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/visitor-pass/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Revenue updated" },
  );

export const useUpdateRentalRevenue = () =>
  useApiMutation(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/rental/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Revenue updated" },
  );
