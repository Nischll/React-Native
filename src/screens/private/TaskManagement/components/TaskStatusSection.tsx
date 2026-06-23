import { useGetTaskByStatusId } from "@/src/api/taskManagement.api";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import TaskCard from "./TaskCard";

const PAGE_LIMIT = 10;

interface TaskStatusSectionProps {
  statusId: number;
  isVisible: boolean;
  search?: string;
  buildingId?: number;
  onCountResolved?: (statusId: number, count: number) => void;
  residentId?: number;
  fromDate?: string;
  toDate?: string;
}

// Fetches a single page
function useTaskPage(
  statusId: number,
  page: number,
  search: string | undefined,
  buildingId: number | undefined,
  residentId: number | undefined,
  fromDate: string | undefined,
  toDate: string | undefined,
  isVisible: boolean,
) {
  return useGetTaskByStatusId(
    statusId,
    page,
    PAGE_LIMIT,
    search,
    undefined,
    buildingId,
    residentId,
    fromDate,
    toDate,
    isVisible,
  );
}

export default function TaskStatusSection({
  statusId,
  isVisible,
  search,
  buildingId,
  residentId,
  fromDate,
  toDate,
  onCountResolved,
}: TaskStatusSectionProps) {
  const [page, setPage] = useState(1);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPage(1);
    setAllTasks([]);
    setHasMore(true);
  }, [search, statusId, residentId, fromDate, toDate]);

  const { data, isLoading, isFetching, isError } = useTaskPage(
    statusId,
    page,
    search,
    buildingId,
    residentId,
    fromDate,
    toDate,
    isVisible,
  );

  useEffect(() => {
    if (!data) return;
    const newTasks = data?.data?.data ?? [];
    const total = data?.data?.total ?? 0;

    setAllTasks((prev) => {
      const updated = page === 1 ? newTasks : [...prev, ...newTasks];
      setHasMore(updated.length < total);
      return updated;
    });

    if (onCountResolved) {
      onCountResolved(statusId, total);
    }
  }, [data, page]);

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage((p) => p + 1);
    }
  };

  if (!isVisible) return null;

  // Initial load
  if (isLoading && page === 1) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator size="small" color="#6366F1" />
        <Text className="text-xs text-gray-400 mt-2">Loading tasks...</Text>
      </View>
    );
  }

  if (isError && allTasks.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-sm text-red-400">Failed to load tasks.</Text>
      </View>
    );
  }

  if (!isLoading && allTasks.length === 0) {
    return (
      <View className="items-center py-14">
        <Text className="text-sm text-gray-400">No tasks found.</Text>
      </View>
    );
  }

  return (
    <View className="pt-3">
      {allTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}

      {/* Load more trigger */}
      {hasMore ? (
        <View className="items-center py-4">
          {isFetching ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text
              className="text-xs text-primary font-medium py-2 px-4"
              onPress={loadMore}
            >
              Load more
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
