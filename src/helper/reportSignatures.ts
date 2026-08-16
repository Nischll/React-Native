import { PDF_ROLE_NAME_DEFAULTS } from "@/src/helper/pdfClosingNames";
import { ReportPdfSignatures } from "@/src/types/reporting.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "reporting.pdf-signatures.v1";

export const REPORT_PDF_SIGNATURE_DEFAULTS: ReportPdfSignatures = {
  buildingManager: "",
  ...PDF_ROLE_NAME_DEFAULTS,
};

export async function loadReportPdfSignatures(): Promise<ReportPdfSignatures> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...REPORT_PDF_SIGNATURE_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReportPdfSignatures>;
    return { ...REPORT_PDF_SIGNATURE_DEFAULTS, ...parsed };
  } catch {
    return { ...REPORT_PDF_SIGNATURE_DEFAULTS };
  }
}

export async function saveReportPdfSignatures(
  signatures: ReportPdfSignatures,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
}
