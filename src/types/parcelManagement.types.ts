export type CourierType = "DHL" | "AMAZON" | "CANADA_POST" | "ALIBABA";
export type PackageType = "BOX" | "ENVELOPE" | "SHEET";
export type PackageSize = "SMALL" | "MEDIUM" | "LARGE" | "OVERSIZED";
export type ParcelCondition = "DAMAGED" | "NEW";
export type ParcelStatus = "RECEIVED" | "DELIVERED";

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
