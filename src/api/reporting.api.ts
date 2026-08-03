import { useApiQuery } from "../hooks/api/useApiQuery";
import { apiService } from "./client";
import { ApiListResponse } from "./auth.api";
import { MonthlyReportResponse } from "../types/reporting.types";

export const useGetMonthlyReport = (
  month?: string,
  buildingId?: number,
  enabled = true,
) => {
  const validMonth = !!month && /^\d{4}-\d{2}$/.test(month);
  const shouldFetch = enabled && validMonth && buildingId != null && buildingId > 0;

  return useApiQuery<ApiListResponse<MonthlyReportResponse>>(
    "/reporting/monthly",
    {
      enabled: shouldFetch,
      retry: 0,
      queryParams: shouldFetch
        ? { month: month!, buildingId: buildingId! }
        : undefined,
    },
  );
};

/** Binary PDF fetch — same params as JSON report. Avoids axios JSON transform corrupting bytes. */
export const fetchMonthlyReportPdf = (month: string, buildingId: number) =>
  apiService.get("/reporting/monthly/pdf", {
    params: { month, buildingId },
    responseType: "arraybuffer",
    transformResponse: (data) => data,
    headers: {
      Accept: "*/*",
      "Content-Type": undefined,
    },
  });
