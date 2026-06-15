import { useMemo } from "react";
import { useGetStaffByBuilding } from "../api/employee.api";

export const useEmployeeByBuildingOptions = (buildingId: number | null) => {
  const { data, isLoading, refetch } = useGetStaffByBuilding(buildingId);

  const employees = useMemo(() => {
    return (
      data?.data?.map((employee) => {
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
          email: employee.email,
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
