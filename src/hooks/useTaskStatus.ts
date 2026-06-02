import { useMemo } from "react";
import { useGetAllTaskStatus } from "../api/taskManagement.api";

export interface EmployeeOption {
  label: string;
  value: string;
  username: string;
}

export const useTaskStatusOptions = () => {
  const { data, isLoading, refetch } = useGetAllTaskStatus();

  const taskStatus = useMemo(() => {
    return (
      data?.data?.map((status) => {
        const fullName = [status.name]
          .filter((name) => name && name.trim() !== "" && name.trim() !== "-")
          .join(" ");

        return {
          label: fullName,
          value: String(status.id),
          // username: status.username,
        };
      }) || []
    );
  }, [data]);

  return {
    taskStatus,
    isLoading,
    refetch,
  };
};
