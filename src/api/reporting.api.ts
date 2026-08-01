import { useApiQuery } from "../hooks/api/useApiQuery";
import { apiService } from "./client";
import { ApiListResponse } from "./auth.api";
import { MonthlyReportResponse } from "../types/reporting.types";

export const useGetMonthlyReport = (month?: string, buildingId?: number, enabled = true) =>
  useApiQuery<ApiListResponse<MonthlyReportResponse>>("/reporting/monthly", {
    enabled: enabled && !!month && buildingId != null,
    retry: 0,
    queryParams: { month, buildingId },
  });

export const fetchMonthlyReportPdf = (month: string, buildingId: number) =>
  apiService.get("/reporting/monthly/pdf", {
    params: { month, buildingId },
    responseType: "arraybuffer",
  });
