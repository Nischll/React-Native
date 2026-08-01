import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  PropertyAgentRequestPojo,
  PropertyAgentResponse,
} from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetPropertyAgentsByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<PropertyAgentResponse>>(
    `/property-agent/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

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
