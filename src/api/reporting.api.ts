import { useApiQuery } from "../hooks/api/useApiQuery";
import { apiService } from "./client";
import { ApiListResponse } from "./auth.api";
import { compactNameParams, serializeQueryParams } from "../helper/pdfClosingNames";
import { MonthlyReportResponse, ReportPdfSignatures } from "../types/reporting.types";

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

/** Binary PDF fetch — same params as JSON report plus closing-page names. */
export const fetchMonthlyReportPdf = (
  month: string,
  buildingId: number,
  signatures?: ReportPdfSignatures,
) =>
  apiService.get("/reporting/monthly/pdf", {
    params: {
      month,
      buildingId,
      ...(signatures
        ? compactNameParams({
            buildingManager: signatures.buildingManager,
            operationsSupervisor: signatures.operationsSupervisor,
            operationsManager: signatures.operationsManager,
            generalManager: signatures.generalManager,
            director: signatures.director,
          })
        : {}),
    },
    paramsSerializer: serializeQueryParams,
    responseType: "arraybuffer",
    transformResponse: [(data) => data],
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      Accept: "application/pdf,*/*",
    },
  });
