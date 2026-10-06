export interface TradeDirectoryResponse {
  id: number;
  buildingId?: number | null;
  name: string;
  company?: string | null;
  contact?: string | null;
}

export interface TradeDirectoryRequest {
  id?: number;
  buildingId: number;
  name: string;
  company?: string;
  contact?: string;
}

/** Keep trades for the selected building. Rows without a building id stay. */
export function tradesForBuilding(
  trades: TradeDirectoryResponse[] | null | undefined,
  buildingId: number | null | undefined,
): TradeDirectoryResponse[] {
  if (buildingId == null || !Number.isFinite(buildingId)) return [];
  return (trades ?? []).filter(
    (trade) =>
      trade.buildingId == null || Number(trade.buildingId) === buildingId,
  );
}
