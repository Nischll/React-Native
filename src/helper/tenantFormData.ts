import type { PickedFile } from "@/src/components/ui/FilePicker";
import { dateInputToIsoOrNull } from "@/src/helper/formatDateTime";
import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";

export type TenantFormKUi = "YES" | "NO" | "UPLOAD" | "";

export type TenantFormFields = {
  fullName: string;
  phoneNumber: string;
  email: string;
  formKSubmitted: TenantFormKUi;
  needsEmergencyAssistance: boolean;
  isActive: boolean;
  activeFromDate: string;
  activeToDate: string;
};

export type TenantFormKSource = {
  id?: number;
  formKFilePath?: string | null;
  formKFileUrl?: string | null;
};

/**
 * UI uses "UPLOAD"; backend FormKStatus enum is YES | NO | UPLOADED.
 */
export function formKUiFromApi(status?: string | null): TenantFormKUi {
  if (!status) return "";
  if (status === "UPLOADED" || status === "UPLOAD") return "UPLOAD";
  if (status === "YES" || status === "NO") return status;
  return "";
}

function formKApiFromUi(status: TenantFormKUi): string {
  if (status === "UPLOAD") return "UPLOADED";
  return status || "NO";
}

export function hasTenantFormK(
  src: TenantFormKSource | null | undefined,
): boolean {
  return Boolean(src?.formKFileUrl?.trim() || src?.formKFilePath?.trim());
}

export function tenantFormKLabel(
  src: TenantFormKSource | null | undefined,
): string {
  const path = src?.formKFilePath?.trim();
  if (path) {
    const last = path.split("/").filter(Boolean).pop();
    if (last) return last;
  }
  return "Form K file";
}

export function remoteFormKFile(
  src: TenantFormKSource | null | undefined,
): PickedFile | null {
  if (!hasTenantFormK(src)) return null;
  return {
    uri: src?.formKFileUrl?.trim() || src?.formKFilePath?.trim() || "",
    name: tenantFormKLabel(src),
    mimeType: "application/octet-stream",
    isLocal: false,
  };
}

function safeFileName(name?: string | null, mimeType?: string | null): string {
  const raw = (name && String(name).trim()) || "";
  const cleaned = raw.replace(/[^\w.\-()+ ]+/g, "_").replace(/\s+/g, "_");
  if (cleaned) return cleaned;
  if (mimeType?.includes("pdf")) return `form-k-${Date.now()}.pdf`;
  if (mimeType?.startsWith("image/")) return `form-k-${Date.now()}.jpg`;
  return `form-k-${Date.now()}.bin`;
}

/** Multipart body matching web CreateResident tenant save (@ModelAttribute). */
export async function buildTenantFormData(
  values: TenantFormFields,
  formKFile?: PickedFile | null,
): Promise<FormData> {
  const fd = new FormData();
  fd.append("fullName", values.fullName || "");
  fd.append("phoneNumber", values.phoneNumber || "");
  fd.append("emailAddress", values.email || "");
  fd.append("formKSubmitted", formKApiFromUi(values.formKSubmitted));
  fd.append(
    "needsEmergencyAssistance",
    String(!!values.needsEmergencyAssistance),
  );
  fd.append("isActive", String(values.isActive !== false));

  const from = dateInputToIsoOrNull(values.activeFromDate);
  const to = dateInputToIsoOrNull(values.activeToDate);
  if (from) fd.append("activeFromDate", from);
  if (to) fd.append("activeToDate", to);

  if (formKFile?.isLocal && formKFile.uri) {
    const part = await toTaskAttachmentPart({
      uri: formKFile.uri,
      name: safeFileName(formKFile.name, formKFile.mimeType),
      mimeType: formKFile.mimeType || "application/octet-stream",
    });
    fd.append("formKFile", part as any);
  }

  return fd;
}

export function tenantEmail(
  item:
    | { email?: string | null; emailAddress?: string | null }
    | null
    | undefined,
): string {
  return item?.emailAddress?.trim() || item?.email?.trim() || "";
}
