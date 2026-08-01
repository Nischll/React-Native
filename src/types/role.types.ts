export interface RoleRequest {
  name: string;
  code: string;
  description: string;
}

export interface RoleResponse {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface RoleModulePermission {
  id: number;
  name: string;
  canRead: boolean;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
