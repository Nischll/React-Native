export type RevenueDetailType =
  | "BOOKING"
  | "FILTER"
  | "ACCESS_DEVICE"
  | "VISITOR_PASS"
  | "RENTAL"
  | "ENTERPHONE";

export interface RevenueDetailItem {
  type: RevenueDetailType;
  sourceId: number;
  createdDate?: string;
  residentId?: number;
  residentUnit?: string;
  residentName?: string;
  buildingName?: string;
  bookingDetail?: { revenue?: RevenueSubDetail; [key: string]: any } | null;
  accessDeviceDetail?: RevenueSubDetail | null;
  filterDetail?: RevenueSubDetail | null;
  visitorPassDetail?: RevenueSubDetail | null;
  rentalDetail?: RevenueSubDetail | null;
  [key: string]: any;
}

export interface RevenueSubDetail {
  id?: number;
  isPaid?: boolean;
  paidFee?: string;
  paidAmount?: string;
  receiptNumber?: string;
  receipt?: string;
  paidType?: string;
  refundable?: boolean;
  [key: string]: any;
}

export interface RevenueDetailUpdateRequest {
  isPaid?: boolean;
  paidFee?: string;
  paidAmount?: string;
  receiptNumber?: string;
  receipt?: string;
  paidType?: string;
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

export function getRevenueSubDetail(item: RevenueDetailItem): RevenueSubDetail | null {
  if (item.type === "BOOKING") return item.bookingDetail?.revenue ?? null;
  if (item.type === "FILTER") return item.filterDetail ?? null;
  if (item.type === "RENTAL") return item.rentalDetail ?? null;
  if (item.type === "ACCESS_DEVICE") return item.accessDeviceDetail ?? null;
  if (item.type === "VISITOR_PASS") return item.visitorPassDetail ?? null;
  return null;
}

export function getRevenueAmount(item: RevenueDetailItem): string {
  const d = getRevenueSubDetail(item);
  return d?.paidFee ?? d?.paidAmount ?? "0";
}

export function isRevenuePaid(item: RevenueDetailItem): boolean {
  return !!getRevenueSubDetail(item)?.isPaid;
}
