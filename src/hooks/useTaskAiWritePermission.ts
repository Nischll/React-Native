import { useGetRoleModules } from "@/src/api/role.api";
import { flattenModules, hasModuleCode } from "@/src/helper/flattenModules";
import { useAuth } from "@/src/providers/AuthProvider";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { useMemo } from "react";

type RoleModuleRow = {
  id: number;
  name: string;
  code?: string;
  canWrite: boolean;
};

/** TM write — hide Retrain when the role explicitly lacks write. */
export function useTaskAiWritePermission() {
  const { user } = useAuth();
  const roleId = user?.roleList?.[0]?.id;
  const { data, isLoading } = useGetRoleModules(roleId, !!roleId);
  const { items } = extractPaginatedList<RoleModuleRow>(data);

  return useMemo(() => {
    const row = items.find(
      (r) =>
        r.code === "TM" ||
        r.name?.toLowerCase().includes("task management"),
    );
    if (row) {
      return { canWrite: row.canWrite, isLoading };
    }
    const hasTm = hasModuleCode(user?.moduleList ?? [], "TM");
    const hasTaskPath = flattenModules(user?.moduleList ?? []).some((m) =>
      (m.path ?? "").includes("task-management"),
    );
    return { canWrite: hasTm || hasTaskPath || !roleId, isLoading };
  }, [items, isLoading, roleId, user?.moduleList]);
}
