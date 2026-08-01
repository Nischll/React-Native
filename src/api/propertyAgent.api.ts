import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  PropertyAgentRequestPojo,
  PropertyAgentResponse,
} from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetPropertyAgentsByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    | ApiListResponse<ApiPaginatedData<PropertyAgentResponse>>
    | ApiListResponseArray<PropertyAgentResponse>
  >(`/property-agent/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

export const useAddPropertyAgent = (residentId: number | undefined) =>
  useApiMutation<PropertyAgentRequestPojo>(
    "post",
    `/property-agent/resident/${residentId}`,
  );

export const useUpdatePropertyAgent = (
  residentId: number | undefined,
  propertyAgentId: number | undefined,
) =>
  useApiMutation<PropertyAgentRequestPojo>(
    "put",
    `/property-agent/${propertyAgentId}/resident/${residentId}`,
  );

export const useDeletePropertyAgent = (
  residentId: number | undefined,
  propertyAgentId: number | undefined,
) =>
  useApiMutation(
    "delete",
    `/property-agent/${propertyAgentId}/resident/${residentId}`,
  );
