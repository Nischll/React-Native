import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  VisitorPassRequestPojo,
  VisitorPassResponse,
} from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetVisitorPassesByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<VisitorPassResponse>>(
    `/visitor-pass/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

export const useAddVisitorPass = (residentId: number | undefined) =>
  useApiMutation<VisitorPassRequestPojo>(
    "post",
    `/visitor-pass/resident/${residentId}`,
  );

export const useUpdateVisitorPass = (
  residentId: number | undefined,
  passId: number | undefined,
) =>
  useApiMutation<VisitorPassRequestPojo>(
    "put",
    `/visitor-pass/${passId}/resident/${residentId}`,
  );

export const useDeleteVisitorPass = (
  residentId: number | undefined,
  passId: number | undefined,
) =>
  useApiMutation("delete", `/visitor-pass/${passId}/resident/${residentId}`);
