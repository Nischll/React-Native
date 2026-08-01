export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] =
  [
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

export type PaidType = "CASH" | "CHEQUE" | "EFT" | "CARD" | "NONE";

export const PAID_TYPE_OPTIONS: { value: PaidType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "EFT", label: "EFT" },
  { value: "CARD", label: "Card" },
];

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

export interface BookingResponse extends BookingRequestPojo {
  id: number;
  buildingName?: string;
  amenityName?: string;
  towerName?: string;
  residentName?: string;
  unit?: string;
  revenue?: BookingRevenueResponse;
}
