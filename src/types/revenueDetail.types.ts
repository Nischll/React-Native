export type RevenueDetailType =
  | "BOOKING"
  | "FILTER"
  | "ACCESS_DEVICE"
  | "VISITOR_PASS"
  | "RENTAL"
  | "ENTERPHONE";

export type RevenueTab = "non-refundable" | "refundable";

export type DepositAmountStatus = "ON_HOLD" | "REFUNDED" | "";

export interface RevenueDetailItem {
  type: RevenueDetailType;
  sourceId: number;
  createdDate?: string;
  residentId?: number;
  residentUnit?: string;
  residentName?: string;
  buildingName?: string;
  bookingDetail?: {
    revenue?: RevenueSubDetail;
    amenityName?: string;
    title?: string;
    amenityId?: number;
    buildingId?: number;
    towerId?: number;
    residentId?: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    [key: string]: any;
  } | null;
  accessDeviceDetail?: RevenueSubDetail | null;
  filterDetail?: RevenueSubDetail | null;
  visitorPassDetail?: RevenueSubDetail | null;
  rentalDetail?: RevenueSubDetail | null;
  [key: string]: any;
}

export interface RevenueSubDetail {
  id?: number;
  isPaid?: boolean;
  paidFee?: string | null;
  paidAmount?: string | null;
  receiptNumber?: string | null;
  receipt?: string | null;
  paidType?: string | null;
  paidNotes?: string | null;
  damageDeposit?: string | null;
  depositReceiptNumber?: string | null;
  damageDepositPaidType?: string | null;
  depositAmountStatus?: string | null;
  refundedBy?: string | null;
  attachmentForDeposit?: string | null;
  preInspection?: string | null;
  postInspection?: string | null;
  description?: string | null;
  refundable?: boolean;
  [key: string]: any;
}

export interface RevenueDetailQueryParams {
  page?: number;
  limit?: number;
  buildingId?: number;
  type?: RevenueDetailType;
  fromDate?: string;
  toDate?: string;
  residentId?: number;
  excludeFree?: boolean;
  refundable?: boolean;
  isPaid?: boolean;
}

export const DEPOSIT_STATUS_OPTIONS: {
  value: DepositAmountStatus;
  label: string;
}[] = [
  { value: "ON_HOLD", label: "On hold" },
  { value: "REFUNDED", label: "Refunded" },
];

export function getRevenueSubDetail(
  item: RevenueDetailItem,
): RevenueSubDetail | null {
  if (item.type === "BOOKING") return item.bookingDetail?.revenue ?? null;
  if (item.type === "FILTER") return item.filterDetail ?? null;
  if (item.type === "RENTAL") return item.rentalDetail ?? null;
  if (item.type === "ACCESS_DEVICE") return item.accessDeviceDetail ?? null;
  if (item.type === "VISITOR_PASS") return item.visitorPassDetail ?? null;
  return null;
}

export function getRevenueAmount(item: RevenueDetailItem): string {
  const d = getRevenueSubDetail(item);
  return String(d?.paidFee ?? d?.paidAmount ?? "0");
}

export function getDepositAmount(item: RevenueDetailItem): string {
  const d = getRevenueSubDetail(item);
  return String(d?.damageDeposit ?? "0");
}

export function isRevenuePaid(item: RevenueDetailItem): boolean {
  return !!getRevenueSubDetail(item)?.isPaid;
}

export function depositStatusLabel(value?: string | null): string {
  if (value === "REFUNDED") return "Refunded";
  if (value === "ON_HOLD") return "On hold";
  return value?.trim() ? value : "—";
}

export function getRevenueReference(item: RevenueDetailItem): string {
  if (item.type === "BOOKING") {
    return (
      item.bookingDetail?.amenityName ||
      item.bookingDetail?.title ||
      `#${item.sourceId}`
    );
  }
  if (item.type === "FILTER") {
    const d = item.filterDetail;
    const parts = [d?.typeOfFilter, d?.size].filter(Boolean);
    return parts.length ? parts.join(" · ") : `#${item.sourceId}`;
  }
  if (item.type === "ACCESS_DEVICE") {
    return item.accessDeviceDetail?.cardNumber
      ? `Card #${item.accessDeviceDetail.cardNumber}`
      : `#${item.sourceId}`;
  }
  if (item.type === "VISITOR_PASS") {
    return item.visitorPassDetail?.visitorPassNumber
      ? `Pass #${item.visitorPassDetail.visitorPassNumber}`
      : `#${item.sourceId}`;
  }
  if (item.type === "RENTAL") {
    return item.rentalDetail?.purchaseFor || `#${item.sourceId}`;
  }
  return `#${item.sourceId}`;
}

export function typeLabel(type: RevenueDetailType): string {
  switch (type) {
    case "BOOKING":
      return "Booking";
    case "FILTER":
      return "Filter";
    case "ACCESS_DEVICE":
      return "Access device";
    case "VISITOR_PASS":
      return "Visitor pass";
    case "RENTAL":
      return "Rental";
    case "ENTERPHONE":
      return "Enterphone";
    default:
      return type;
  }
}
