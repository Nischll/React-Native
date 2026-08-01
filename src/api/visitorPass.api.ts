import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  VisitorPassRequestPojo,
  VisitorPassResponse,
} from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetVisitorPassesByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    | ApiListResponse<ApiPaginatedData<VisitorPassResponse>>
    | ApiListResponseArray<VisitorPassResponse>
  >(`/visitor-pass/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

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
