import { Reaction } from "../api/communication.api";

export interface DashboardStatisticsResponse {
  buildingId: number;
  month: string;
  totalBookings: number;
  totalRevenue: number;
  totalViolations: number;
}

export interface Notice {
  id: number;
  message: string;
  createdDate: string;
  createdBy: number;
  createdByFullName: string;
  seen: boolean | null;
  reactions: Reaction[];
}
