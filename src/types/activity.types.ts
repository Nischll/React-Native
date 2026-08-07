export type DashboardReminderPeriod = "today" | "weekly";

export type DashboardReminderPeriodResponse = "TODAY" | "WEEKLY";

export interface DashboardTaskReminder {
  id: number;
  title: string;
  deadline?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | string | null;
  taskNumber?: string | null;
  statusName?: string | null;
  assignedToName?: string | null;
}

export interface DashboardBookingReminder {
  id: number;
  amenityName?: string | null;
  /** Backend field — prefer over title */
  description?: string | null;
  title?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  towerId?: number | null;
  towerName?: string | null;
  status?: string | null;
  residentName?: string | null;
  residentUnit?: string | null;
}

export interface DashboardPreventiveMaintenanceReminder {
  id: number;
  maintenanceItem?: string | null;
  reminderMonth?: string | null;
  frequency?: string | null;
  trade?: string | null;
  statusForReminderMonth?: string | null;
}

export interface DashboardTradeVisitReminder {
  id: number;
  tradeName?: string | null;
  scheduledAppointmentAt?: string | null;
  company?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  reasonForVisit?: string | null;
  lifecycleStatus?: string | null;
  /** Backend sets lifecycle status on this field */
  status?: string | null;
  residentUnit?: string | null;
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
