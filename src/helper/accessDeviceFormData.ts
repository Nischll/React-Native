import type { PickedFile } from "@/src/components/ui/FilePicker";

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

/**
 * Same multipart shape as web `buildAccessDeviceFormData`.
 * Backend expects @ModelAttribute multipart — JSON body fails on create.
 */
export function buildAccessDeviceFormData(
  data: AccessDeviceFormFields,
  ownerApproval?: PickedFile | null,
): FormData {
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
    fd.append("ownerApproval", {
      uri: ownerApproval.uri,
      name: ownerApproval.name || "owner-approval",
      type: ownerApproval.mimeType || "application/octet-stream",
    } as any);
  }

  return fd;
}

export function accessDeviceRequiresOwnerApproval(
  assignedTo: string | undefined,
): boolean {
  return assignedTo === "TENANT";
}
