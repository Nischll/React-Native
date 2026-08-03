import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { GeneratorTestResponse } from "../types/generatorTests.types";
import {
  ApiListResponse,
  ApiListResponseArray,
  ApiPaginatedData,
} from "./auth.api";

export const useGetGeneratorTests = (
  params: {
    buildingId?: number;
    page?: number;
    limit?: number;
    testDateFrom?: string;
    testDateTo?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.testDateFrom) queryParams.testDateFrom = params.testDateFrom;
  if (params.testDateTo) queryParams.testDateTo = params.testDateTo;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<GeneratorTestResponse>>
    | ApiListResponseArray<GeneratorTestResponse>
  >("/generator-tests", {
    enabled: enabled && params.buildingId != null,
    retry: 0,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetGeneratorTestById = (
  id: number | undefined,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<GeneratorTestResponse>>(
    `/generator-tests/${id}`,
    {
      enabled: enabled && id != null,
      retry: 0,
    },
  );

/** Backend uses @ModelAttribute — send multipart FormData, not JSON. */
export const useAddGeneratorTest = (buildingId: number | undefined) =>
  useApiMutation<FormData>(
    "post",
    `/generator-tests/building/${buildingId}`,
  );

export const useUpdateGeneratorTest = (
  id: number | undefined,
  buildingId: number | undefined,
) =>
  useApiMutation<FormData>(
    "put",
    `/generator-tests/${id}/building/${buildingId}`,
  );

export const useDeleteGeneratorTest = () =>
  useApiMutation<{ id: number; buildingId: number }>(
    "delete",
    (vars) =>
      `/generator-tests/${vars?.id}/building/${vars?.buildingId}`,
  );

export const useDeleteGeneratorTestImage = () =>
  useApiMutation<{ imageId: number }>(
    "delete",
    (vars) => `/generator-tests/images/${vars?.imageId}`,
  );
