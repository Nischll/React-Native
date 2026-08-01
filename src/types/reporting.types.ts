export interface MonthlyRevenueSummary {
  total?: number;
  breakdownByType?: Record<string, number>;
}

export interface MonthlyReportResponse {
  month?: string;
  buildingId?: number;
  generatedForUsername?: string;
  building?: { name?: string; address?: string } | null;
  tasks?: unknown[];
  bookings?: unknown[];
  revenueSummary?: MonthlyRevenueSummary | null;
  purchaseRecords?: unknown[];
  parcelLogs?: unknown[];
  visitorPassLogs?: unknown[];
  visitorParkingLogs?: unknown[];
  tradeServiceLogs?: unknown[];
  residents?: unknown[];
}
