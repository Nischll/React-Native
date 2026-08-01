import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { AmenityRequest, AmenityResponse } from "../types/amenity.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

type AmenityListParams = {
  page?: number;
  limit?: number;
  search?: string;
  buildingId?: number;
};

export const useGetAmenities = (
  paramsOrEnabled: AmenityListParams | boolean = {},
  enabledArg = true,
) => {
  const params =
    typeof paramsOrEnabled === "boolean" ? {} : (paramsOrEnabled ?? {});
  const enabled =
    typeof paramsOrEnabled === "boolean" ? paramsOrEnabled : enabledArg;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<AmenityResponse>>
    | ApiListResponseArray<AmenityResponse>
  >("/amenity", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });
};

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
