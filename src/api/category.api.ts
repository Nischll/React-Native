import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { Category, CategoryRequest } from "../types/category.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetCategories = (
  params: { page?: number; limit?: number; search?: string } = {},
  enabled = true,
) =>
  useApiQuery<
    ApiListResponse<ApiPaginatedData<Category>> | ApiListResponseArray<Category>
  >("/category", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(params),
  });

export const useAddCategory = () =>
  useApiMutation<CategoryRequest>("post", "/category");

export const useUpdateCategory = (id?: number) =>
  useApiMutation<CategoryRequest>("put", `/category/${id}`);

export const useDeleteCategory = () => useApiMutation("delete", "/category");
