export type DashboardReminderPeriod = "today" | "weekly";

export type DashboardReminderPeriodResponse = "TODAY" | "WEEKLY";

export interface DashboardTaskReminder {
  id: number;
  title: string;
  deadline?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | null;
  taskNumber?: string | null;
  statusName?: string | null;
}

export interface DashboardBookingReminder {
  id: number;
  amenityName?: string | null;
  title?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  towerId?: number | null;
  towerName?: string | null;
  status?: string | null;
}

export interface DashboardPreventiveMaintenanceReminder {
  id: number;
  maintenanceItem?: string | null;
  reminderMonth?: string | null;
}

export interface DashboardTradeVisitReminder {
  id: number;
  tradeName?: string | null;
  scheduledAppointmentAt?: string | null;
  company?: string | null;
  lifecycleStatus?: string | null;
  status?: string | null;
}

export interface DashboardRemindersResponse {
  buildingId: number;
  period: DashboardReminderPeriodResponse;
  fromDate: string;
  toDate: string;
  tasks: DashboardTaskReminder[];
  bookings: DashboardBookingReminder[];
  preventiveMaintenance: DashboardPreventiveMaintenanceReminder[];
  tradeVisits: DashboardTradeVisitReminder[];
}
