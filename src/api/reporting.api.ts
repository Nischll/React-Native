import { PickedFile } from "../components/ui/FilePicker";
import { buildMonthlyReportPdfFormData } from "../helper/reportSignatures";
import { postAuthenticatedPdf } from "../helper/savePdfFile";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { MonthlyReportPdfOptions, MonthlyReportResponse } from "../types/reporting.types";
import { ApiListResponse } from "./auth.api";

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

/** Binary PDF — POST multipart cover + signatures + optional logo. */
export async function fetchMonthlyReportPdf(
  month: string,
  buildingId: number,
  options: MonthlyReportPdfOptions,
  companyLogo?: PickedFile | null,
): Promise<string> {
  const formData = await buildMonthlyReportPdfFormData(
    month,
    buildingId,
    options,
    companyLogo,
  );
  return postAuthenticatedPdf("/reporting/monthly/pdf", formData);
}
