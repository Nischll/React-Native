import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { BuildingImprovementResponse } from "../types/building-improvements.type";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetBuildingImprovements = (
  buildingId: number | undefined,
  page?: number,
  limit?: number,
  enabled: boolean = true,
) => {
  const queryParams: Record<string, number> = {};
  if (buildingId != null) queryParams.buildingId = buildingId;
  if (page != null) queryParams.page = page;
  if (limit != null) queryParams.limit = limit;

  return useApiQuery<
    ApiListResponse<ApiPaginatedData<BuildingImprovementResponse>>
  >("/building-improvements", {
    enabled: enabled && buildingId != null && buildingId > 0,
    retry: 0,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetBuildingImprovementById = (
  id: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponse<BuildingImprovementResponse>>(
    `/building-improvements/${id}`,
    {
      enabled: enabled && id != null && id > 0,
      retry: 0,
    },
  );

// export const useCreateBuildingImprovement = () =>
//   useMutation({
//     mutationFn: async (payload: BuildingImprovementMutationPayload) => {
//       const fd = new FormData();
//       appendBuildingImprovementFormData(fd, payload);
//       return apiService.post(API_ENDPOINTS.BUILDING_IMPROVEMENTS.CREATE, fd);
//     },
//     onSuccess: (response) => {
//       const msg = (response.data as { message?: string })?.message ?? "Saved";
//       toast({ variant: "success", title: "Success", description: msg });
//     },
//     onError: (error: unknown) => {
//       const err = error as { response?: { data?: { message?: string } }; message?: string };
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: err?.response?.data?.message ?? err?.message ?? "Request failed",
//       });
//     },
//   });

// export const useUpdateBuildingImprovement = () =>
//   useMutation({
//     mutationFn: async (vars: BuildingImprovementMutationPayload & { id: number }) => {
//       const { id, ...rest } = vars;
//       const fd = new FormData();
//       appendBuildingImprovementFormData(fd, rest);
//       return apiService.put(API_ENDPOINTS.BUILDING_IMPROVEMENTS.UPDATE(id), fd);
//     },
//     onSuccess: (response) => {
//       const msg = (response.data as { message?: string })?.message ?? "Updated";
//       toast({ variant: "success", title: "Success", description: msg });
//     },
//     onError: (error: unknown) => {
//       const err = error as { response?: { data?: { message?: string } }; message?: string };
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: err?.response?.data?.message ?? err?.message ?? "Request failed",
//       });
//     },
//   });

export const useDeleteBuildingImprovement = (id: number | undefined) =>
  useApiMutation("delete", `building-improvements/${id}`);

/** Soft-delete a single image (BI update permission). */
// export const useDeleteBuildingImprovementImage = () =>
//   useApiMutation<{ imageId: number }>(
//     "delete",
//     (vars) => API_ENDPOINTS.BUILDING_IMPROVEMENTS.DELETE_IMAGE(vars!.imageId)
//   );
