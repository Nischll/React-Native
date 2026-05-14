export interface RoleApiResponse {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface GetRolesResponse {
  statusCode: number;
  message: string;
  data: RoleApiResponse[];
}

export interface GetEmployeeResponse {
  statusCode: number;
  message: string;
  data: Employee[];
}

export interface Employee {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  employeeNumber?: string;
  natureOfEmployment?: string;
  position?: string;
  roleList: [];
  buildingList: [];
  active?: boolean;
  isActive?: boolean;
  profilePicture?: string; // URL or path to profile picture (legacy)
  profilePicturePath?: string; // Path to profile picture
  profilePictureUrl?: string; // Full URL to profile picture
}
