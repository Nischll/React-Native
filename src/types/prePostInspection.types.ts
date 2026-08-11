import type { BookingRevenueResponse } from "./booking.types";
import type { PickedFile } from "@/src/components/ui/FilePicker";

export const PRE_POST_INSPECTION_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export type PrePostInspectionStatus =
  (typeof PRE_POST_INSPECTION_STATUSES)[number]["value"];

export type InspectionImageSide = "PRE" | "POST";

export const IMAGE_AREA_MAX = 500;
export const IMAGE_DESCRIPTION_MAX = 2000;

export interface PrePostInspectionImageResponse {
  id: number;
  imageSide: InspectionImageSide | string;
  storedPath?: string;
  originalFileName?: string;
  fileUrl?: string;
  area?: string | null;
  description?: string | null;
}

export interface PrePostInspectionAmenityResponse {
  id: number;
  amenityId: number;
  amenityName: string;
  residentSignature: string | null;
  caretakerSignature: string | null;
  preImages: PrePostInspectionImageResponse[];
  postImages: PrePostInspectionImageResponse[];
}

export interface PrePostInspectionResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  residentId: number;
  residentUnit: string;
  residentName?: string;
  bookingId?: number | null;
  inspectionDate: string;
  inspectionTime: string;
  status: PrePostInspectionStatus | string;
  depositReturned: boolean | null;
  finalResidentSignature: string | null;
  finalCaretakerSignature: string | null;
  notes: string | null;
  createdByUserName: string;
  createdDate: string;
  amenities: PrePostInspectionAmenityResponse[];
}

/** Local / multipart image item (existing server id and/or new picked file). */
export type PrePostInspectionImageMutation = {
  id?: number;
  file?: PickedFile;
  area?: string;
  description?: string;
};

export type PrePostInspectionAmenityMutation = {
  id?: number;
  amenityId: number;
  residentSignature?: string;
  caretakerSignature?: string;
  preImages?: PrePostInspectionImageMutation[];
  postImages?: PrePostInspectionImageMutation[];
};

export type PrePostInspectionMutationPayload = {
  buildingId: number;
  residentId: number;
  bookingId?: number | null;
  inspectionDate: string;
  inspectionTime?: string;
  status?: PrePostInspectionStatus | string;
  depositReturned?: boolean | null;
  finalResidentSignature?: string;
  finalCaretakerSignature?: string;
  notes?: string;
  amenities: PrePostInspectionAmenityMutation[];
};

export type BookingAmenityByResidentDateItem = {
  id?: number;
  amenityId: number;
  amenityName?: string;
  name?: string;
  description?: string;
  bookingId?: number;
  revenue?: BookingRevenueResponse | null;
};

export function statusLabel(value: string | undefined | null): string {
  if (!value) return "—";
  const found = PRE_POST_INSPECTION_STATUSES.find((s) => s.value === value);
  return found?.label ?? value;
}

export function depositReturnedLabel(
  value: boolean | null | undefined,
): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

export function residentDisplayLabel(row: {
  residentUnit?: string | null;
  residentName?: string | null;
}): string {
  const unit = row.residentUnit?.trim();
  const name = row.residentName?.trim();
  if (unit && name) return `${unit} (${name})`;
  if (unit) return unit;
  if (name) return name;
  return "—";
}
