import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  OCP_BASE_PATH,
  OcpWeeklyResponse,
} from "../types/overnightConciergePatrol.types";
import { ApiListResponse } from "./auth.api";

export const useGetOcpWeekly = (
  params: { buildingId?: number; weekEnding: string; employeeId?: number },
  enabled = true,
) =>
  useApiQuery<ApiListResponse<OcpWeeklyResponse>>(
    `${OCP_BASE_PATH}/records/weekly`,
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams: {
        weekEnding: params.weekEnding,
        ...(params.buildingId != null ? { buildingId: params.buildingId } : {}),
        ...(params.employeeId != null ? { employeeId: params.employeeId } : {}),
      },
    },
  );

export const useUpdateOcpWeeklyCell = () =>
  useApiMutation<FormData>("put", `${OCP_BASE_PATH}/records/weekly/cell`, {
    showSuccessToast: false,
  });

export const useAddOcpAttachments = () =>
  useApiMutation<
    { formData: FormData; pathVars: { detailId: number } },
    unknown,
    { detailId: number }
  >(
    "post",
    (vars) => `${OCP_BASE_PATH}/records/details/${vars?.detailId}/attachments`,
    { showSuccessToast: false },
  );

export const useUpdateOcpAttachment = () =>
  useApiMutation<
    { formData: FormData; pathVars: { id: number } },
    unknown,
    { id: number }
  >("put", (vars) => `${OCP_BASE_PATH}/records/attachments/${vars?.id}`, {
    showSuccessToast: false,
  });

export const useDeleteOcpAttachment = () =>
  useApiMutation<
    { pathVars: { attachmentId: number } },
    unknown,
    { attachmentId: number }
  >(
    "delete",
    (vars) =>
      `${OCP_BASE_PATH}/records/attachments/${vars?.attachmentId}`,
    { showSuccessToast: false },
  );
