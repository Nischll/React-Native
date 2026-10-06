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

export interface ReportPdfSignatures {
  buildingManager: string;
  operationsSupervisor: string;
  operationsManager: string;
  generalManager: string;
  director: string;
}

export type MonthlyReportRole = "BUILDING_MANAGER" | "CONCIERGE" | "CARETAKER";

export type MonthlyReportCoverOptions = {
  reportRole: MonthlyReportRole;
  preparedBy: string;
  companyWebsite: string;
};

export type MonthlyReportPdfOptions = ReportPdfSignatures &
  MonthlyReportCoverOptions;
