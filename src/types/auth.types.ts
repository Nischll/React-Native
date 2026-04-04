export interface ModuleItem {
  subscriptionId: number | null;
  subscriptionName: string | null;
  discountPercentage: number | null;
  level: number | null;
  appointmentCount: number | null;
  isActive: boolean | null;
  name: string;
  icon: string;
  path: string | null;
  code: string;
  moduleList: ModuleItem[];
}
export interface UserData {
  userId: number;
  subscriptionName: string | null;
  level: number | null;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  extraFields: any | null;
  moduleList: ModuleItem[];
  buildingList: BuildingItem[];
  roleList: RoleItem[];
  profilePicturePath?: string; // Path to profile picture
  profilePictureUrl?: string; // Full URL to profile picture
}

export interface BuildingItem {
  label: string;
  value: string;
}
export interface RoleItem {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetchInit: () => void;
  user: UserData | null;
  loading: boolean;
  selectedBuilding: BuildingItem | null;
  setSelectedBuilding: (building: BuildingItem | null) => void;
  buildingId: number | null;
  openBuildingSelectDialog: () => void;
}

export interface LoginType {
  username: string;
  password: string;
}
