import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { Category, CategoryRequest } from "../types/category.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetCategories = (enabled = true) =>
  useApiQuery<ApiListResponseArray<Category>>("/category", {
    enabled,
    retry: 0,
  });

export const useAddCategory = () =>
  useApiMutation<CategoryRequest>("post", "/category");

export const useUpdateCategory = (id?: number) =>
  useApiMutation<CategoryRequest>("put", `/category/${id}`);

export const useDeleteCategory = () => useApiMutation("delete", "/category");
