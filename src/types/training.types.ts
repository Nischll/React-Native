export type TrainingEmployeeStatus = "DRAFT" | "COMPLETED";

export interface TrainingTemplate {
  id: number;
  buildingId: number;
  buildingName?: string;
  title: string;
  originalFilename?: string;
  documentUrl?: string;
  uploadedByName?: string;
  createdAt?: string;
}

export interface TrainingEmployeeSummary {
  id: number;
  employeeId: number;
  employeeName: string;
  copiedFilename?: string;
  documentUrl?: string;
  status: TrainingEmployeeStatus;
}

export interface TrainingResponse {
  id: number;
  buildingId: number;
  buildingName?: string;
  templateId: number;
  templateTitle?: string;
  title: string;
  description?: string;
  createdByName?: string;
  createdAt?: string;
  totalEmployees?: number;
  completedEmployees?: number;
}

export interface TrainingDetail extends TrainingResponse {
  employees: TrainingEmployeeSummary[];
}

export interface TrainingCreateRequest {
  buildingId: number;
  templateId: number;
  title: string;
  description?: string;
  employeeIds: number[];
}
