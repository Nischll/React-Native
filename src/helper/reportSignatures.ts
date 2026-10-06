import { PDF_ROLE_NAME_DEFAULTS } from "@/src/helper/pdfClosingNames";
import {
  MonthlyReportCoverOptions,
  MonthlyReportPdfOptions,
  MonthlyReportRole,
  ReportPdfSignatures,
} from "@/src/types/reporting.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { PickedFile } from "@/src/components/ui/FilePicker";
import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";

const STORAGE_KEY = "reporting.pdf-signatures.v1";
const COVER_STORAGE_KEY = "reporting.pdf-cover.v1";

export const REPORT_PDF_SIGNATURE_DEFAULTS: ReportPdfSignatures = {
  buildingManager: "",
  ...PDF_ROLE_NAME_DEFAULTS,
};

export const MONTHLY_REPORT_ROLE_OPTIONS: {
  value: MonthlyReportRole;
  label: string;
}[] = [
  { value: "BUILDING_MANAGER", label: "Building Manager" },
  { value: "CONCIERGE", label: "Concierge" },
  { value: "CARETAKER", label: "Caretaker" },
];

export const DEFAULT_MONTHLY_REPORT_COVER: MonthlyReportCoverOptions = {
  reportRole: "BUILDING_MANAGER",
  preparedBy: "",
  companyWebsite: "https://www.alliancemaintenance.ca",
};

export const MONTHLY_REPORT_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export const MONTHLY_REPORT_SIGNATURE_FIELDS: {
  key: keyof ReportPdfSignatures;
  label: string;
}[] = [
  { key: "buildingManager", label: "Building Manager" },
  { key: "operationsSupervisor", label: "Operations Supervisor" },
  { key: "operationsManager", label: "Operations Manager" },
  { key: "generalManager", label: "General Manager" },
  { key: "director", label: "Director" },
];

export function monthlyReportRoleLabel(
  role: MonthlyReportRole | string | null | undefined,
): string {
  return (
    MONTHLY_REPORT_ROLE_OPTIONS.find((o) => o.value === role)?.label ??
    MONTHLY_REPORT_ROLE_OPTIONS[0].label
  );
}

function isReportRole(value: unknown): value is MonthlyReportRole {
  return (
    value === "BUILDING_MANAGER" ||
    value === "CONCIERGE" ||
    value === "CARETAKER"
  );
}

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

export async function loadMonthlyReportCoverOptions(): Promise<MonthlyReportCoverOptions> {
  try {
    const raw = await AsyncStorage.getItem(COVER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MONTHLY_REPORT_COVER };
    const parsed = JSON.parse(raw) as Partial<MonthlyReportCoverOptions>;
    return {
      reportRole: isReportRole(parsed.reportRole)
        ? parsed.reportRole
        : DEFAULT_MONTHLY_REPORT_COVER.reportRole,
      preparedBy: String(
        parsed.preparedBy ?? DEFAULT_MONTHLY_REPORT_COVER.preparedBy,
      ),
      companyWebsite: String(
        parsed.companyWebsite ?? DEFAULT_MONTHLY_REPORT_COVER.companyWebsite,
      ),
    };
  } catch {
    return { ...DEFAULT_MONTHLY_REPORT_COVER };
  }
}

export async function saveMonthlyReportCoverOptions(
  value: MonthlyReportCoverOptions,
): Promise<void> {
  await AsyncStorage.setItem(
    COVER_STORAGE_KEY,
    JSON.stringify({
      reportRole: value.reportRole,
      preparedBy: value.preparedBy,
      companyWebsite: value.companyWebsite,
    }),
  );
}

export async function loadMonthlyReportPdfOptions(): Promise<MonthlyReportPdfOptions> {
  const [signatures, cover] = await Promise.all([
    loadReportPdfSignatures(),
    loadMonthlyReportCoverOptions(),
  ]);
  return { ...signatures, ...cover };
}

export async function saveMonthlyReportPdfOptions(
  value: MonthlyReportPdfOptions,
): Promise<void> {
  const {
    reportRole,
    preparedBy,
    companyWebsite,
    buildingManager,
    operationsSupervisor,
    operationsManager,
    generalManager,
    director,
  } = value;
  await Promise.all([
    saveMonthlyReportCoverOptions({ reportRole, preparedBy, companyWebsite }),
    saveReportPdfSignatures({
      buildingManager,
      operationsSupervisor,
      operationsManager,
      generalManager,
      director,
    }),
  ]);
}

export async function validateMonthlyReportLogo(
  file: PickedFile,
): Promise<string | null> {
  const mime = (file.mimeType ?? "").toLowerCase();
  const name = (file.name ?? "").toLowerCase();
  const allowedMime =
    mime === "image/png" ||
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/webp" ||
    mime === "image/gif" ||
    mime.startsWith("image/");
  const allowedExt = /\.(png|jpe?g|webp|gif)$/i.test(name);
  if (!allowedMime && !allowedExt) {
    return "Logo must be PNG, JPG, WebP, or GIF.";
  }
  try {
    const info = await FileSystem.getInfoAsync(file.uri);
    if (info.exists && "size" in info && typeof info.size === "number") {
      if (info.size > MONTHLY_REPORT_LOGO_MAX_BYTES) {
        return "Logo must be 5MB or smaller.";
      }
    }
  } catch {
    /* picker already succeeded; skip size if we cannot read it */
  }
  return null;
}

/** Multipart body for POST /reporting/monthly/pdf */
export async function buildMonthlyReportPdfFormData(
  month: string,
  buildingId: number,
  options: MonthlyReportPdfOptions,
  companyLogo?: PickedFile | null,
): Promise<FormData> {
  const fd = new FormData();
  fd.append("month", month);
  fd.append("buildingId", String(buildingId));

  const role = options.reportRole || DEFAULT_MONTHLY_REPORT_COVER.reportRole;
  fd.append("reportRole", role);

  const preparedBy =
    options.preparedBy.trim() || options.buildingManager.trim();
  if (preparedBy) fd.append("preparedBy", preparedBy);

  const companyWebsite =
    options.companyWebsite.trim() ||
    DEFAULT_MONTHLY_REPORT_COVER.companyWebsite;
  if (companyWebsite) fd.append("companyWebsite", companyWebsite);

  for (const field of MONTHLY_REPORT_SIGNATURE_FIELDS) {
    const name = options[field.key].trim();
    if (name) fd.append(field.key, name);
  }

  if (companyLogo?.uri) {
    const part = await toTaskAttachmentPart(companyLogo);
    fd.append("companyLogo", part as unknown as Blob);
  }

  return fd;
}
