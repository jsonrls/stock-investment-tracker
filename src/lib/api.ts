const BASE_URL = 'https://pse-market-data-api.vercel.app';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  percent_change: number;
  volume: number;
  as_of: string | null;
}

export interface StockListResponse {
  as_of: string | null;
  count: number;
  total: number;
  limit: number | null;
  offset: number;
  data: Stock[];
}

export interface MoversResponse {
  type: 'gainers' | 'losers' | 'active';
  as_of: string | null;
  count: number;
  data: Stock[];
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number | null;
  volume: number;
}

export interface CandleResponse {
  symbol: string;
  exchange: string;
  source: string;
  period: 'd' | 'w' | 'm';
  from: string;
  to: string;
  count: number;
  data: Candle[];
}

export interface HistorySnapshot {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  percent_change: number;
  volume: number;
  as_of: string | null;
}

export interface HistoryResponse {
  symbol: string;
  count: number;
  data: HistorySnapshot[];
  missing_dates: string[];
}

export interface PollResponse {
  event: string;
  as_of: string | null;
  count: number;
  stocks: Stock[];
  etag: string;
}

export type MoverType = 'gainers' | 'losers' | 'active';
export type SortField = 'symbol' | 'percent_change' | 'volume' | 'price' | 'name';
export type SortOrder = 'asc' | 'desc';

async function fetchAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  listStocks: (params?: {
    q?: string;
    sort?: SortField;
    order?: SortOrder;
    limit?: number;
    offset?: number;
    min_volume?: number;
  }): Promise<StockListResponse> => {
    const p: Record<string, string> = {};
    if (params?.q) p.q = params.q;
    if (params?.sort) p.sort = params.sort;
    if (params?.order) p.order = params.order;
    if (params?.limit !== undefined) p.limit = String(params.limit);
    if (params?.offset !== undefined) p.offset = String(params.offset);
    if (params?.min_volume !== undefined) p.min_volume = String(params.min_volume);
    return fetchAPI<StockListResponse>('/api/v1/stocks', p);
  },

  getStock: (symbol: string): Promise<Stock> =>
    fetchAPI<Stock>(`/api/v1/stocks/${symbol}`),

  getStockHistory: (symbol: string, params: { from: string; to: string }): Promise<HistoryResponse> =>
    fetchAPI<HistoryResponse>(`/api/v1/stocks/${symbol}/history`, params),

  getMovers: (type: MoverType = 'gainers', limit = 10): Promise<MoversResponse> =>
    fetchAPI<MoversResponse>('/api/v1/movers', { type, limit: String(limit) }),

  searchStocks: (q: string, limit = 20): Promise<StockListResponse> =>
    fetchAPI<StockListResponse>('/api/v1/search', { q, limit: String(limit) }),

  getCandles: (
    symbol: string,
    params: { from?: string; to?: string; period?: 'd' | 'w' | 'm' }
  ): Promise<CandleResponse> => {
    const p: Record<string, string> = {};
    if (params.from) p.from = params.from;
    if (params.to) p.to = params.to;
    if (params.period) p.period = params.period;
    return fetchAPI<CandleResponse>(`/api/v1/stocks/${symbol}/candles`, p);
  },

  pollQuotes: (symbols?: string[]): Promise<PollResponse> => {
    const p: Record<string, string> = {};
    if (symbols && symbols.length > 0) p.symbols = symbols.join(',');
    return fetchAPI<PollResponse>('/api/v1/stream/poll', p);
  },
};
