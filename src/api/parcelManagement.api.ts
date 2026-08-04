import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  ParcelRequestPojo,
  ParcelResponse,
} from "../types/parcelManagement.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

function invalidateParcelQueries(qc: ReturnType<typeof useQueryClient>) {
  // Match web: any query whose key mentions parcels (list + by-id)
  qc.invalidateQueries({
    predicate: (q) => String(q.queryKey[0] ?? "").includes("parcels"),
  });
}

export const useGetParcels = (
  params: {
    page?: number;
    limit?: number;
    trackingId?: string;
    buildingId?: number;
    residentId?: number;
    fromDate?: string;
    toDate?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.trackingId?.trim())
    queryParams.trackingId = params.trackingId.trim();
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.residentId != null) queryParams.residentId = params.residentId;
  if (params.fromDate != null) queryParams.fromDate = params.fromDate;
  if (params.toDate != null) queryParams.toDate = params.toDate;

  return useApiQuery<ApiListResponse<ApiPaginatedData<ParcelResponse>>>(
    "/parcels",
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
};

export const useAddParcel = (buildingId: number) => {
  const qc = useQueryClient();

  const mutation = useApiMutation<ParcelRequestPojo>(
    "post",
    `/parcels/building/${buildingId}`,
  );

  const mutateWithRefresh: typeof mutation.mutate = (vars, opts) => {
    mutation.mutate(vars, {
      ...opts,
      onSuccess: (...args) => {
        invalidateParcelQueries(qc);

        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
};

export const useGetParcelById = (parcelId: number) => {
  return useApiQuery<ApiListResponse<ParcelResponse>>(`/parcels/${parcelId}`, {
    enabled: parcelId != null,
    retry: 0,
    refetchOnMount: true,
    // refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useDeleteParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) => {
  const qc = useQueryClient();

  const mutation = useApiMutation(
    "delete",
    `/parcels/${parcelId}/building/${buildingId}`,
  );

  const mutateWithRefresh: typeof mutation.mutate = (vars, opts) => {
    mutation.mutate(vars, {
      ...opts,
      onSuccess: (...args) => {
        invalidateParcelQueries(qc);
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
};

export const useRemindParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) =>
  useApiMutation(
    "post",
    `/parcels/${parcelId}/building/${buildingId}/remind-now`,
  );

export const useDeliverParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) => {
  const qc = useQueryClient();

  const mutation = useApiMutation(
    "post",
    `/parcels/${parcelId}/building/${buildingId}/deliver`,
  );

  const mutateWithRefresh: typeof mutation.mutate = (vars, opts) => {
    mutation.mutate(vars, {
      ...opts,
      onSuccess: (...args) => {
        // Same as web: refresh list + detail after deliver confirm
        invalidateParcelQueries(qc);
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
};

export const useUpdateParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) => {
  const qc = useQueryClient();

  const mutation = useApiMutation(
    "put",
    `/parcels/${parcelId}/building/${buildingId}`,
  );

  const mutateWithRefresh: typeof mutation.mutate = (vars, opts) => {
    mutation.mutate(vars, {
      ...opts,
      onSuccess: (...args) => {
        invalidateParcelQueries(qc);
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
};
