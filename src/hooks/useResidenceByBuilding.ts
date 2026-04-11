import { useEffect, useState } from "react";
import { useGetResidenceByBuilding } from "../api/residence.api";
import { getStoredBuilding } from "../storage/sessionStorage";

export interface ResidenceOption {
  label: string;
  value: string;
}

export const useResidencesForActiveBuilding = () => {
  const [buildingId, setBuildingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetResidenceByBuilding(
    buildingId || undefined,
  );

  useEffect(() => {
    const loadBuilding = async () => {
      const building = await getStoredBuilding();

      setBuildingId(Number(building?.value) || null);
    };

    loadBuilding();
  }, []);

  const residences: ResidenceOption[] =
    data?.data?.map((item) => ({
      label: `${item.unit} - ${item.residentName}`,
      value: String(item.id),
    })) || [];

  return {
    residences,
    isLoading,
    refetch,
  };
};
