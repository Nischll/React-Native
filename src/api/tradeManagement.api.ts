import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  TradeVisitCreatePojo,
  TradeVisitResponse,
  TradeVisitUpdatePojo,
} from "../types/tradeManagement.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetTradeVisits = (
  params: {
    page?: number;
    limit?: number;
    buildingId?: number;
    residentId?: number;
    lifecycle?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, unknown> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.residentId != null) queryParams.residentId = params.residentId;
  if (params.lifecycle?.trim()) queryParams.lifecycle = params.lifecycle.trim();

  return useApiQuery<ApiListResponse<ApiPaginatedData<TradeVisitResponse>>>(
    "/trade-visit",
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
};

export const useGetTradeVisitById = (id: number | undefined, enabled = true) =>
  useApiQuery<ApiListResponse<TradeVisitResponse>>(`/trade-visit/${id}`, {
    enabled: enabled && id != null && id > 0,
    retry: 0,
  });

export const useCreateTradeVisit = () =>
  useApiMutation<TradeVisitCreatePojo>("post", "/trade-visit", {
    successMessage: "Trade visit created",
  });

export const useUpdateTradeVisit = (tradeId: number) =>
  useApiMutation<TradeVisitUpdatePojo>("put", `/trade-visit/${tradeId}`);

export const useUpdateTradeVisitPmApproval = (tradeId: number) =>
  useApiMutation<FormData>("post", `/trade-visit/${tradeId}/pm-approval`, {
    successMessage: "PM approval updated",
  });

/** POST multipart: approved + file (file required when approved=true). approved=false revokes and deletes file. */
// export const useSubmitTradeVisitPmApproval = () =>
//   useMutation({
//     mutationFn: async (vars: {
//       id: number;
//       approved: boolean;
//       file?: File | null;
//     }) => {
//       const fd = new FormData();
//       fd.append("approved", vars.approved ? "true" : "false");
//       if (vars.approved && vars.file) fd.append("file", vars.file);
//       return apiService.post(
//         API_ENDPOINTS.TRADE_VISIT.PM_APPROVAL(vars.id),
//         fd,
//       );
//     },
//     onSuccess: (response) => {
//       const msg =
//         (response.data as { message?: string })?.message ??
//         "PM approval updated";
//       toast({ variant: "success", title: "Success", description: msg });
//     },
//     onError: (error: unknown) => {
//       const err = error as {
//         response?: { data?: { message?: string } };
//         message?: string;
//       };
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description:
//           err?.response?.data?.message ?? err?.message ?? "Request failed",
//       });
//     },
//   });

// export const useCheckInTradeVisit = () =>
//   useApiMutation<
//     TradeVisitCheckInPojo & { pathVars: { id: number } },
//     unknown,
//     { id: number }
//   >("post", (vars) => API_ENDPOINTS.TRADE_VISIT.CHECK_IN(vars!.id));

// export const useCheckoutTradeVisit = () =>
//   useApiMutation<
//     TradeVisitCheckoutPojo & { pathVars: { id: number } },
//     unknown,
//     { id: number }
//   >("post", (vars) => API_ENDPOINTS.TRADE_VISIT.CHECKOUT(vars!.id));
