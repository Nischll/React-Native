import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { AmenityRequest, AmenityResponse } from "../types/amenity.types";
import { ApiListResponse, ApiListResponseArray } from "./auth.api";

export const useGetAmenities = (enabled = true) =>
  useApiQuery<ApiListResponseArray<AmenityResponse>>("/amenity", {
    enabled,
    retry: 0,
  });

export const useGetAmenityById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<AmenityResponse>>(`/amenity/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
  });

export const useAddAmenity = () =>
  useApiMutation<AmenityRequest>("post", "/amenity");

export const useUpdateAmenity = (id?: number) =>
  useApiMutation<AmenityRequest>("put", `/amenity/${id}`);

export const useDeleteAmenity = () => useApiMutation("delete", "/amenity");
