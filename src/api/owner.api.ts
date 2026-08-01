import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { OwnerRequestPojo, OwnerResponse } from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetOwnersByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<OwnerResponse>>(
    `/owner/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

export const useAddOwner = (residentId: number | undefined) =>
  useApiMutation<OwnerRequestPojo>("post", `/owner/resident/${residentId}`);

export const useUpdateOwner = (
  residentId: number | undefined,
  ownerId: number | undefined,
) =>
  useApiMutation<OwnerRequestPojo>(
    "put",
    `/owner/${ownerId}/resident/${residentId}`,
  );

export const useDeleteOwner = (
  residentId: number | undefined,
  ownerId: number | undefined,
) => useApiMutation("delete", `/owner/${ownerId}/resident/${residentId}`);
