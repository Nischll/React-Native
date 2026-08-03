import { useGetAllTaskStatus } from "@/src/api/taskManagement.api";
import { TaskStatus } from "@/src/types/task-management.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { useMemo } from "react";

export interface TaskStatusOption {
  label: string;
  value: string;
  categoryId: number | null;
}

function toOptions(items: TaskStatus[]): TaskStatusOption[] {
  const seen = new Set<number>();
  const unique: TaskStatus[] = [];

  for (const status of items) {
    if (seen.has(status.id)) continue;
    seen.add(status.id);
    unique.push(status);
  }

  return unique
    .slice()
    .sort((a, b) => (a.sortingNumber ?? 0) - (b.sortingNumber ?? 0))
    .map((status) => ({
      label: (status.name ?? "").trim() || String(status.id),
      value: String(status.id),
      categoryId: status.categoryId ?? null,
    }));
}

/**
 * @param categoryId When set, only statuses for that category are returned
 * (avoids duplicate labels like "Open" / "In Progress" across categories).
 */
export const useTaskStatusOptions = (categoryId?: number | null) => {
  const { data, isLoading, refetch } = useGetAllTaskStatus();

  const allTaskStatus = useMemo(() => {
    const { items } = extractPaginatedList<TaskStatus>(data);
    return toOptions(items);
  }, [data]);

  const taskStatus = useMemo(() => {
    if (categoryId == null) return allTaskStatus;
    return allTaskStatus.filter((s) => s.categoryId === categoryId);
  }, [allTaskStatus, categoryId]);

  return {
    taskStatus,
    allTaskStatus,
    isLoading,
    refetch,
  };
};
