export interface TradeDirectoryResponse {
  id: number;
  name: string;
  company?: string | null;
  contact?: string | null;
}

export interface TradeDirectoryRequest {
  name: string;
  company?: string;
  contact?: string;
}
