/** Backend enum values: CONFIRM | CANCEL | PENDING */
export type BookingStatus = "PENDING" | "CONFIRM" | "CANCEL";

export const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] =
  [
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRM", label: "Confirmed" },
    { value: "CANCEL", label: "Cancelled" },
  ];

/** Normalize any API / legacy status string to the backend enum. */
export function normalizeBookingStatus(
  value?: string | null,
): BookingStatus {
  const raw = String(value ?? "PENDING").toUpperCase();
  if (raw === "CONFIRM" || raw === "CONFIRMED") return "CONFIRM";
  if (raw === "CANCEL" || raw === "CANCELLED") return "CANCEL";
  return "PENDING";
}

export function bookingStatusLabel(value?: string | null): string {
  const status = normalizeBookingStatus(value);
  if (status === "CONFIRM") return "Confirmed";
  if (status === "CANCEL") return "Cancelled";
  return "Pending";
}

export type PaidType = "CASH" | "CHEQUE" | "EFT" | "CARD" | "NONE";

export const PAID_TYPE_OPTIONS: { value: PaidType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "EFT", label: "EFT" },
  { value: "CARD", label: "Card" },
];

export function paidTypeLabel(value?: string | null): string {
  if (!value || value === "NONE") return "—";
  const match = PAID_TYPE_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

export interface BookingRevenueRequestPojo {
  isPaid?: boolean;
  paidFee?: string;
  receiptNumber?: string;
  damageDeposit?: string;
  depositReceiptNumber?: string;
  damageDepositPaidType?: PaidType;
  preInspection?: string;
  postInspection?: string;
  description?: string;
  paidType?: PaidType;
}

export interface BookingRevenueResponse extends BookingRevenueRequestPojo {
  id?: number;
  bookingId?: number;
  depositAmountStatus?: string | null;
  refundedBy?: string | null;
  attachmentForDeposit?: string | null;
}

export interface BookingRequestPojo {
  title: string;
  description?: string;
  buildingId: number;
  amenityId: number;
  towerId?: number;
  residentId?: number;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  revenue?: BookingRevenueRequestPojo;
}

export interface BookingResponse {
  id: number;
  title?: string;
  description?: string;
  buildingId?: number;
  buildingName?: string;
  amenityId?: number;
  amenityName?: string;
  amenityDescription?: string;
  towerId?: number;
  towerName?: string;
  residentId?: number;
  residentName?: string;
  /** Backend field name */
  residentUnit?: string;
  /** Legacy / list alias */
  unit?: string;
  startDate: string;
  endDate: string;
  status: BookingStatus | string;
  revenue?: BookingRevenueResponse;
}
