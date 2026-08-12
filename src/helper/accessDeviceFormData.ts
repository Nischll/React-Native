import type { PickedFile } from "@/src/components/ui/FilePicker";
import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";

type AccessDeviceFormFields = {
  type: string;
  cardNumber: string;
  accessLevel: string;
  assignedTo: string;
  status: string;
  isPaid?: boolean;
  isFree?: boolean;
  paidAmount?: string | null;
  paidType?: string | null;
  receipt?: string | null;
  paidNotes?: string | null;
};

export type AccessDeviceOwnerApprovalSource = {
  ownerApproval?: string | File | null;
  ownerApprovalUrl?: string | null;
};

/** API stores a path in `ownerApproval`; optional URL may also be present. */
export function getAccessDeviceOwnerApprovalRef(
  src: AccessDeviceOwnerApprovalSource | null | undefined,
): string | undefined {
  const url = src?.ownerApprovalUrl?.trim();
  if (url) return url;
  const o = src?.ownerApproval;
  if (typeof o === "string" && o.trim()) return o.trim();
  return undefined;
}

export function hasAccessDeviceOwnerApproval(
  src: AccessDeviceOwnerApprovalSource | null | undefined,
): boolean {
  return Boolean(getAccessDeviceOwnerApprovalRef(src));
}

export function ownerApprovalLabel(
  src: AccessDeviceOwnerApprovalSource | null | undefined,
): string {
  const ref = getAccessDeviceOwnerApprovalRef(src);
  if (!ref) return "Owner approval";
  const last = ref.split("/").filter(Boolean).pop();
  return last && last.length > 0 ? last : "Owner approval";
}

export function remoteOwnerApprovalFile(
  src: AccessDeviceOwnerApprovalSource | null | undefined,
): PickedFile | null {
  const ref = getAccessDeviceOwnerApprovalRef(src);
  if (!ref) return null;
  return {
    uri: ref,
    name: ownerApprovalLabel(src),
    mimeType: "application/octet-stream",
    isLocal: false,
  };
}

/**
 * Same multipart shape as web `buildAccessDeviceFormData`.
 * Backend expects @ModelAttribute multipart — JSON body fails on create.
 */
export async function buildAccessDeviceFormData(
  data: AccessDeviceFormFields,
  ownerApproval?: PickedFile | null,
): Promise<FormData> {
  const fd = new FormData();
  fd.append("type", data.type);
  fd.append("cardNumber", data.cardNumber ?? "");
  fd.append("accessLevel", data.accessLevel ?? "");
  fd.append("assignedTo", data.assignedTo);
  fd.append("status", data.status);

  if (data.paidAmount != null && String(data.paidAmount).trim() !== "") {
    fd.append("paidAmount", String(data.paidAmount));
  }
  if (data.receipt != null && String(data.receipt).trim() !== "") {
    fd.append("receipt", String(data.receipt));
  }
  if (data.paidType) fd.append("paidType", String(data.paidType));
  if (data.paidNotes != null && String(data.paidNotes).trim() !== "") {
    fd.append("paidNotes", String(data.paidNotes));
  }
  if (data.isPaid !== undefined) fd.append("isPaid", String(data.isPaid));
  if (data.isFree !== undefined) fd.append("isFree", String(data.isFree));

  if (ownerApproval?.isLocal && ownerApproval.uri) {
    const part = await toTaskAttachmentPart({
      uri: ownerApproval.uri,
      name: ownerApproval.name || "owner-approval",
      mimeType: ownerApproval.mimeType || "application/octet-stream",
    });
    fd.append("ownerApproval", part as any);
  }

  return fd;
}

export function accessDeviceRequiresOwnerApproval(
  assignedTo: string | undefined,
): boolean {
  return assignedTo === "TENANT";
}
