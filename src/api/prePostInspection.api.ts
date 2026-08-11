import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { PrePostInspectionResponse } from "../types/prePostInspection.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export type PrePostInspectionListParams = {
  buildingId?: number;
  bookingId?: number;
  page?: number;
  limit?: number;
};

function invalidatePrePostQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({
    predicate: (q) =>
      String(q.queryKey[0] ?? "").includes("pre-post-inspections"),
  });
}

export const useGetPrePostInspections = (
  params: PrePostInspectionListParams = {},
  enabled = true,
) => {
  const queryParams: Record<string, number> = {};
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.bookingId != null) queryParams.bookingId = params.bookingId;
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<PrePostInspectionResponse>>
    | ApiListResponse<PrePostInspectionResponse[]>
  >("/pre-post-inspections", {
    enabled:
      enabled &&
      ((params.buildingId != null && params.buildingId > 0) ||
        (params.bookingId != null && params.bookingId > 0)),
    retry: 0,
    queryParams:
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetPrePostInspectionById = (
  id: number | undefined,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<PrePostInspectionResponse>>(
    `/pre-post-inspections/${id}`,
    {
      enabled: enabled && id != null && id > 0,
      retry: 0,
      refetchOnMount: true,
    },
  );

export const useCreatePrePostInspection = () => {
  const qc = useQueryClient();
  const mutation = useApiMutation<FormData>("post", "/pre-post-inspections", {
    successMessage: "Inspection saved",
  });
  return {
    ...mutation,
    mutate: (body: FormData, opts?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(body, {
        ...opts,
        onSuccess: (data, vars, ctx) => {
          invalidatePrePostQueries(qc);
          opts?.onSuccess?.(data, vars, ctx);
        },
      }),
    mutateAsync: async (
      body: FormData,
      opts?: Parameters<typeof mutation.mutateAsync>[1],
    ) => {
      const res = await mutation.mutateAsync(body, opts);
      invalidatePrePostQueries(qc);
      return res;
    },
  };
};

export const useUpdatePrePostInspection = (id: number | undefined) => {
  const qc = useQueryClient();
  const mutation = useApiMutation<FormData>(
    "put",
    `/pre-post-inspections/${id}`,
    { successMessage: "Inspection updated" },
  );
  return {
    ...mutation,
    mutate: (body: FormData, opts?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(body, {
        ...opts,
        onSuccess: (data, vars, ctx) => {
          invalidatePrePostQueries(qc);
          opts?.onSuccess?.(data, vars, ctx);
        },
      }),
  };
};

export const useDeletePrePostInspection = () => {
  const qc = useQueryClient();
  const mutation = useApiMutation<{ id: number }>(
    "delete",
    (vars) => `/pre-post-inspections/${vars?.id}`,
    { successMessage: "Inspection deleted" },
  );
  return {
    ...mutation,
    mutate: (
      body: { id: number },
      opts?: Parameters<typeof mutation.mutate>[1],
    ) =>
      mutation.mutate(body, {
        ...opts,
        onSuccess: (data, vars, ctx) => {
          invalidatePrePostQueries(qc);
          opts?.onSuccess?.(data, vars, ctx);
        },
      }),
  };
};

/** Soft-delete a single image. */
export const useDeletePrePostInspectionImage = () =>
  useApiMutation<{ imageId: number }>(
    "delete",
    (vars) => `/pre-post-inspections/images/${vars?.imageId}`,
    { successMessage: "Image removed" },
  );
