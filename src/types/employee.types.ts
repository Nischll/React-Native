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

export type NatureOfEmployment =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "TEMPORARY"
  | "INTERN";

export const NATURE_OF_EMPLOYMENT_OPTIONS: {
  value: NatureOfEmployment;
  label: string;
}[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "TEMPORARY", label: "Temporary" },
  { value: "INTERN", label: "Intern" },
];

// Form-side payload used to build the multipart request for add/update staff.
export interface StaffRequestPojo {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  employeeNumber?: string;
  natureOfEmployment?: NatureOfEmployment | "";
  position?: string;
  roleList?: number[];
  buildingList?: number[];
  profilePicture?: { uri: string; name: string; mimeType: string } | null;
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
