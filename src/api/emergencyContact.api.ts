import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  EmergencyContactRequestPojo,
  EmergencyContactResponse,
} from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetEmergencyContactsByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    | ApiListResponse<ApiPaginatedData<EmergencyContactResponse>>
    | ApiListResponseArray<EmergencyContactResponse>
  >(`/emergency-contact/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

export const useAddEmergencyContact = (residentId: number | undefined) =>
  useApiMutation<EmergencyContactRequestPojo>(
    "post",
    `/emergency-contact/resident/${residentId}`,
  );

export const useUpdateEmergencyContact = (
  residentId: number | undefined,
  contactId: number | undefined,
) =>
  useApiMutation<EmergencyContactRequestPojo>(
    "put",
    `/emergency-contact/${contactId}/resident/${residentId}`,
  );

export const useDeleteEmergencyContact = (
  residentId: number | undefined,
  contactId: number | undefined,
) =>
  useApiMutation(
    "delete",
    `/emergency-contact/${contactId}/resident/${residentId}`,
  );
