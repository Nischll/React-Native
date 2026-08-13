export type CourierType =
  | "DHL"
  | "AMAZON"
  | "CANADA_POST"
  | "ALIBABA"
  | "PUROLATOR"
  | "RUSH"
  | "DRAGONFLY"
  | "FEDEX"
  | "INTELCOM";

export type PackageType = "BOX" | "ENVELOPE" | "SHEET";
export type PackageSize = "SMALL" | "MEDIUM" | "LARGE" | "OVERSIZED";
export type ParcelCondition = "DAMAGED" | "NEW";
export type ParcelStatus = "RECEIVED" | "DELIVERED";

export const COURIER_OPTIONS: { value: CourierType; label: string }[] = [
  { value: "DHL", label: "DHL" },
  { value: "AMAZON", label: "Amazon" },
  { value: "CANADA_POST", label: "Canada Post" },
  { value: "ALIBABA", label: "Alibaba" },
  { value: "PUROLATOR", label: "Purolator" },
  { value: "RUSH", label: "Rush" },
  { value: "DRAGONFLY", label: "Dragonfly" },
  { value: "FEDEX", label: "FedEx" },
  { value: "INTELCOM", label: "Intelcom" },
];

export function courierLabel(courier?: string | null): string {
  if (!courier) return "—";
  return (
    COURIER_OPTIONS.find((o) => o.value === courier)?.label ??
    courier.replace(/_/g, " ")
  );
}

export const PACKAGE_TYPE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: "BOX", label: "Box" },
  { value: "ENVELOPE", label: "Envelope" },
  { value: "SHEET", label: "Sheet" },
];

export const PACKAGE_SIZE_OPTIONS: { value: PackageSize; label: string }[] = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "OVERSIZED", label: "Oversized" },
];

export const PARCEL_CONDITION_OPTIONS: {
  value: ParcelCondition;
  label: string;
}[] = [
  { value: "NEW", label: "New" },
  { value: "DAMAGED", label: "Damaged" },
];

export const PARCEL_STATUS_OPTIONS: { value: ParcelStatus; label: string }[] = [
  { value: "RECEIVED", label: "Received" },
  { value: "DELIVERED", label: "Delivered" },
];

export const TRACKING_ID_MAX = 250;

export interface ParcelRequestPojo {
  residentId: number;
  courier?: CourierType;
  packageType?: PackageType;
  size?: PackageSize;
  location?: string;
  condition?: ParcelCondition;
  receivedById?: number;
}

export interface ParcelDeliverRequest {
  recipientSignature?: string;
  releasedById?: number;
  pickupTimestamp?: string;
}

/** Parcel detail response (GET /api/parcels/{id} and GET /api/parcels/tracking/{trackingId}) */
export interface ParcelResponse {
  /** Parcel & building */
  id: number;
  buildingId?: number;
  buildingName?: string;
  buildingAddress?: string;

  /** Resident */
  residentId: number;
  residentName?: string;
  unit?: string;
  phone?: string;
  recipientEmail?: string;

  /** Package */
  courier?: CourierType;
  packageType?: PackageType;
  size?: PackageSize;
  location?: string;
  condition?: ParcelCondition;
  receivedTime?: string;
  status?: ParcelStatus;
  trackingId?: string;

  /** Received by (concierge) */
  receivedById?: number;
  receivedByName?: string;
  receivedByEmail?: string;

  /** Released by (concierge) */
  releasedById?: number;
  releasedByName?: string;
  releasedByEmail?: string;

  /** Delivery */
  recipientSignature?: string;
  pickupTimestamp?: string;

  /** Storage policy */
  reminderSentAt?: string;
  finalNoticeSentAt?: string;
  storageActionAt?: string;
  storageAction?: string;

  /** Audit */
  isActive?: boolean;
  createdDate?: string;
  createdByName?: string;
  lastModifiedDate?: string;
  lastModifiedByName?: string;

  /** QR code */
  qrCodeUrl?: string;
}
