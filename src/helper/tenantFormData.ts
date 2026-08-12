import type { PickedFile } from "@/src/components/ui/FilePicker";
import { dateInputToIsoOrNull } from "@/src/helper/formatDateTime";
import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";

export type TenantFormFields = {
  fullName: string;
  phoneNumber: string;
  email: string;
  formKSubmitted: "YES" | "NO" | "UPLOAD" | "";
  needsEmergencyAssistance: boolean;
  isActive: boolean;
  activeFromDate: string;
  activeToDate: string;
};

/** Multipart body matching web CreateResident tenant save (@ModelAttribute). */
export async function buildTenantFormData(
  values: TenantFormFields,
  formKFile?: PickedFile | null,
): Promise<FormData> {
  const fd = new FormData();
  fd.append("fullName", values.fullName || "");
  fd.append("phoneNumber", values.phoneNumber || "");
  fd.append("emailAddress", values.email || "");
  fd.append("formKSubmitted", values.formKSubmitted || "NO");
  fd.append(
    "needsEmergencyAssistance",
    String(!!values.needsEmergencyAssistance),
  );
  fd.append("isActive", String(values.isActive !== false));
  fd.append(
    "activeFromDate",
    dateInputToIsoOrNull(values.activeFromDate) ?? "",
  );
  fd.append("activeToDate", dateInputToIsoOrNull(values.activeToDate) ?? "");

  if (formKFile?.isLocal && formKFile.uri) {
    const part = await toTaskAttachmentPart(formKFile);
    fd.append("formKFile", part as any);
  }

  return fd;
}

export function tenantEmail(
  item: { email?: string | null; emailAddress?: string | null } | null | undefined,
): string {
  return item?.emailAddress?.trim() || item?.email?.trim() || "";
}
