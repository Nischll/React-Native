export interface EmployeeBuildingAssignmentRequest {
  userId: number;
  buildingId: number;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface EmployeeBuildingAssignmentResponse {
  id: number;
  userId: number;
  buildingId: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  user?: {
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    username: string;
    email: string;
    employeeNumber?: string;
  };
  building?: {
    id: number;
    name: string;
    address: string;
  };
}
