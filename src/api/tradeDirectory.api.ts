import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  TradeDirectoryRequest,
  TradeDirectoryResponse,
} from "../types/tradeDirectory.types";
import { buildPageQuery } from "../utils/listPagination";
import {
  ApiListResponse,
  ApiListResponseArray,
  ApiPaginatedData,
} from "./auth.api";

const TRADE_DIRECTORY_KEY = "/trade";

export const useGetTrades = (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    buildingId?: number | null;
  } = {},
  enabled = true,
) => {
  const queryParams = buildPageQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    buildingId:
      params.buildingId != null && params.buildingId > 0
        ? params.buildingId
        : undefined,
  });
  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<TradeDirectoryResponse>>
    | ApiListResponseArray<TradeDirectoryResponse>
  >(TRADE_DIRECTORY_KEY, {
    enabled,
    retry: 0,
    queryParams,
  });
};

export const useGetTradeById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<TradeDirectoryResponse>>(
    `${TRADE_DIRECTORY_KEY}/${id}`,
    {
      enabled: enabled && !!id,
      retry: 0,
    },
  );

export const useAddTrade = () =>
  useApiMutation<TradeDirectoryRequest>("post", TRADE_DIRECTORY_KEY);

export const useUpdateTrade = (id?: number) =>
  useApiMutation<TradeDirectoryRequest>("put", `${TRADE_DIRECTORY_KEY}/${id}`);

export const useDeleteTrade = () =>
  useApiMutation("delete", TRADE_DIRECTORY_KEY);
