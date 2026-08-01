import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  EmergencyContactRequestPojo,
  EmergencyContactResponse,
} from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetEmergencyContactsByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<EmergencyContactResponse>>(
    `/emergency-contact/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

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
