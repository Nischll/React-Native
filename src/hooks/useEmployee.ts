import { useMemo } from "react";
import { useGetStaff } from "../api/employee.api";

export interface EmployeeOption {
  label: string;
  value: string;
  username: string;
}

export const useEmployeeOptions = (
  page?: number,
  limit?: number,
  searchQuery?: string,
) => {
  const { data, isLoading, refetch } = useGetStaff(page, limit, searchQuery);

  const employees: EmployeeOption[] = useMemo(() => {
    return (
      data?.data?.data?.map((employee) => {
        const fullName = [
          employee.firstName,
          employee.middleName,
          employee.lastName,
        ]
          .filter((name) => name && name.trim() !== "" && name.trim() !== "-")
          .join(" ");

        return {
          label: fullName,
          value: String(employee.id),
          username: employee.username,
        };
      }) || []
    );
  }, [data]);

  return {
    employees,
    isLoading,
    refetch,
  };
};
