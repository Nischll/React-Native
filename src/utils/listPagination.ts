export const PAGE_SIZE = 10;

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ExtractPageOpts = {
  /** Requested page (1-based). When the API returns a bare array, items are sliced. */
  page?: number;
  /** Page size. Used with page for client fallback when the API ignores pagination. */
  limit?: number;
};

/**
 * Normalizes both shapes returned by the Bild Strata API:
 * - { data: T[] }
 * - { data: { data: T[], total, page, limit } }
 * - bare T[]
 *
 * When the payload is a bare array and page/limit are provided, slices locally
 * so list UIs still paginate if the endpoint has not been updated yet.
 */
export function extractPaginatedList<T>(
  response: unknown,
  opts: ExtractPageOpts = {},
): PaginatedList<T> {
  const empty: PaginatedList<T> = {
    items: [],
    total: 0,
    page: opts.page ?? 1,
    limit: opts.limit ?? PAGE_SIZE,
  };

  if (response == null) return empty;

  const root: any = response;
  const payload = root?.data !== undefined ? root.data : root;

  if (Array.isArray(payload)) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? PAGE_SIZE;
    // Only slice when the caller asked for a specific page (list screens).
    // Dropdown/select callers omit page so they receive the full array.
    if (opts.page != null && opts.limit != null) {
      const start = (page - 1) * limit;
      return {
        items: payload.slice(start, start + limit) as T[],
        total: payload.length,
        page,
        limit,
      };
    }
    return {
      items: payload as T[],
      total: payload.length,
      page: 1,
      limit: payload.length || PAGE_SIZE,
    };
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) {
      return {
        items: payload.data as T[],
        total: Number(payload.total ?? payload.data.length),
        page: Number(payload.page ?? opts.page ?? 1),
        limit: Number(payload.limit ?? opts.limit ?? PAGE_SIZE),
      };
    }
  }

  return empty;
}

export function buildPageQuery(params: Record<string, any> = {}) {
  const queryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return Object.keys(queryParams).length ? queryParams : undefined;
}

export function pageHasMore(page: number, pageSize: number, total: number) {
  return page * pageSize < total;
}
