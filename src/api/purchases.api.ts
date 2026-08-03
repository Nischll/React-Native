import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  AccessDeviceRequestPojo,
  EnterphoneRequestPojo,
  FilterRequestPojo,
  RentalRequestPojo,
  VisitorPassRequestPojo,
} from "../types/resident.types";
import { RevenueDetailItem, RevenueDetailType } from "../types/revenueDetail.types";
import { ApiListResponseArray, ApiPaginatedData } from "./auth.api";

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
    | ApiListResponseArray<RevenueDetailItem>
    | ApiPaginatedData<RevenueDetailItem>
  >("/purchases", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useAddFilterPurchase = () =>
  useApiMutation<FilterRequestPojo>(
    "post",
    (vars?: { residentId?: number }) => `/filter/resident/${vars?.residentId}`,
    { successMessage: "Filter purchase created" },
  );

export const useUpdateFilterPurchase = () =>
  useApiMutation<FilterRequestPojo>(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/filter/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Filter purchase updated" },
  );

export const useAddEnterphonePurchase = () =>
  useApiMutation<EnterphoneRequestPojo>(
    "post",
    (vars?: { residentId?: number }) =>
      `/enterphone/resident/${vars?.residentId}`,
    { successMessage: "Enterphone created" },
  );

export const useUpdateEnterphonePurchase = () =>
  useApiMutation<EnterphoneRequestPojo>(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/enterphone/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Enterphone updated" },
  );

export const useAddAccessDevicePurchase = () =>
  useApiMutation<AccessDeviceRequestPojo | FormData>(
    "post",
    (vars?: { residentId?: number }) =>
      `/access-device/resident/${vars?.residentId}`,
    { successMessage: "Access device created" },
  );

export const useUpdateAccessDevicePurchase = () =>
  useApiMutation<AccessDeviceRequestPojo | FormData>(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/access-device/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Access device updated" },
  );

export const useAddVisitorPassPurchase = () =>
  useApiMutation<VisitorPassRequestPojo>(
    "post",
    (vars?: { residentId?: number }) =>
      `/visitor-pass/resident/${vars?.residentId}`,
    { successMessage: "Visitor pass created" },
  );

export const useUpdateVisitorPassPurchase = () =>
  useApiMutation<VisitorPassRequestPojo>(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/visitor-pass/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Visitor pass updated" },
  );

export const useAddRentalPurchase = () =>
  useApiMutation<RentalRequestPojo>(
    "post",
    (vars?: { residentId?: number }) => `/rental/resident/${vars?.residentId}`,
    { successMessage: "Rental created" },
  );

export const useUpdateRentalPurchase = () =>
  useApiMutation<RentalRequestPojo>(
    "put",
    (vars?: { id?: number; residentId?: number }) =>
      `/rental/${vars?.id}/resident/${vars?.residentId}`,
    { successMessage: "Rental updated" },
  );
