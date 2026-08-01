import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  ChecklistPeriod,
  ChecklistTemplateRequest,
  ChecklistTemplateResponse,
  WeeklyCellUpdateRequest,
  WeeklyChecklistResponse,
} from "../types/checklist.types";
import {
  ApiListResponse,
  ApiListResponseArray,
  ApiPaginatedData,
} from "./auth.api";

/** Field name for the period-ending param/body key, per period. */
export const periodEndingKey = (period: ChecklistPeriod) =>
  period === "monthly" ? "monthEnding" : "yearEnding";

// ---- Templates (shared across all 4 periods) ----

export const useGetChecklistTemplates = (
  basePath: string,
  buildingId: number | undefined,
  enabled = true,
  page?: number,
  limit?: number,
) => {
  const queryParams: Record<string, number> = {};
  if (buildingId != null) queryParams.buildingId = buildingId;
  if (page != null) queryParams.page = page;
  if (limit != null) queryParams.limit = limit;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<ChecklistTemplateResponse>>
    | ApiListResponseArray<ChecklistTemplateResponse>
  >(`${basePath}/templates`, {
    enabled: enabled && buildingId != null,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useAddChecklistTemplate = (basePath: string) =>
  useApiMutation<ChecklistTemplateRequest>("post", `${basePath}/templates`, {
    showSuccessToast: false,
  });

export const useDeleteChecklistTemplate = (basePath: string) =>
  useApiMutation<{ id: number }, any, { id: number }>(
    "delete",
    (vars) => `${basePath}/templates/${vars?.id}`,
  );

export const useLoadChecklistTemplateDefaults = (
  basePath: string,
  buildingId: number | undefined,
) =>
  useApiMutation<{ buildingId?: number }>(
    "post",
    `${basePath}/templates/building/${buildingId}/load-defaults`,
    { showSuccessToast: true },
  );

// ---- Weekly-grid records (daily & weekly periods) ----

export const useGetWeeklyChecklist = (
  basePath: string,
  params: { buildingId?: number; weekEnding: string; employeeId?: number },
  enabled = true,
) =>
  useApiQuery<ApiListResponse<WeeklyChecklistResponse>>(
    `${basePath}/records/weekly`,
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams: {
        weekEnding: params.weekEnding,
        ...(params.buildingId != null
          ? { buildingId: params.buildingId }
          : {}),
        ...(params.employeeId != null
          ? { employeeId: params.employeeId }
          : {}),
      },
    },
  );

export const useUpdateWeeklyChecklistCell = (basePath: string) =>
  useApiMutation<WeeklyCellUpdateRequest>(
    "put",
    `${basePath}/records/weekly/cell`,
    { showSuccessToast: false },
  );

// ---- Period-cell records (monthly & annual periods) ----
// Response/body shape uses "monthEnding" or "yearEnding" as the key (see periodEndingKey).

export const useGetPeriodChecklist = (
  basePath: string,
  period: "monthly" | "annual",
  params: { buildingId?: number; periodEnding: string; employeeId?: number },
  enabled = true,
) => {
  const key = periodEndingKey(period);
  return useApiQuery<ApiListResponse<Record<string, any>>>(
    `${basePath}/records/${period}`,
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams: {
        [key]: params.periodEnding,
        ...(params.buildingId != null
          ? { buildingId: params.buildingId }
          : {}),
        ...(params.employeeId != null
          ? { employeeId: params.employeeId }
          : {}),
      },
    },
  );
};

export const useUpdatePeriodChecklistCell = (
  basePath: string,
  period: "monthly" | "annual",
) =>
  useApiMutation<Record<string, any>>(
    "put",
    `${basePath}/records/${period}/cell`,
    { showSuccessToast: false },
  );
