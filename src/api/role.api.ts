import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  RoleModulePermission,
  RoleRequest,
  RoleResponse,
} from "../types/role.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetRoles = () =>
  useApiQuery<ApiListResponseArray<RoleResponse>>("/role", { retry: 0 });

export const useAddRole = () => useApiMutation<RoleRequest>("post", "/role");

export const useUpdateRole = (roleId: number | undefined) =>
  useApiMutation<RoleRequest>("put", `/role/${roleId}`);

export const useGetRoleModules = (
  roleId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<RoleModulePermission>>(
    `/role/modules/${roleId}`,
    {
      enabled: enabled && roleId !== undefined,
      retry: 0,
    },
  );

export const useUpdateRoleModules = (roleId: number | undefined) =>
  useApiMutation<RoleModulePermission[]>("put", `/role/modules/${roleId}`);
