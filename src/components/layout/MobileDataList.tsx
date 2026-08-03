import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../feedback/EmptyState";
import { SkeletonCard } from "../feedback/SkeletonCard";
import AppIcon from "../ui/AppIcon";
import AppInput from "../ui/AppInput";
import Card from "../ui/Card";

type SortOrder = "asc" | "desc";

export interface MobileColumn<T> {
  key: keyof T;
  label: string;

  primary?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  hidden?: boolean;

  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  hasMore?: boolean;
  total?: number;
  onPageChange?: (page: number) => void;
}

interface MobileDataListProps<T> {
  data: T[];
  columns: MobileColumn<T>[];

  loading?: boolean;
  refreshing?: boolean;

  searchable?: boolean;
  sortable?: boolean;

  backendMode?: boolean;

  pagination?: PaginationConfig;

  onSearch?: (search: string) => void;
  onSort?: (field: keyof T, order: SortOrder) => void;
  onRefresh?: () => void;

  keyExtractor: (item: T) => string;

  emptyMessage?: string;

  renderActions?: (row: T) => React.ReactNode;
  onFilterPress?: () => void;

  /** Default page size when pagination prop is omitted (frontend paging). */
  defaultPageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

function cellText(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function MobileDataList<T>({
  data,
  columns,
  loading = false,
  refreshing = false,
  searchable = false,
  sortable = false,
  backendMode = false,
  pagination,
  onSearch,
  onSort,
  onRefresh,
  keyExtractor,
  emptyMessage = "No data found",
  renderActions,
  onFilterPress,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: MobileDataListProps<T>) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof T>();
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [internalPage, setInternalPage] = useState(1);

  // Debounce Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (backendMode) {
        onSearch?.(search);
      } else {
        setInternalPage(1);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, backendMode]);

  // Frontend Search
  const filteredData = useMemo(() => {
    if (backendMode || !searchable) return data;

    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) =>
      columns.some((col) => {
        if (!col.searchable) return false;
        const value = row[col.key];
        return String(value ?? "")
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [data, search, columns, backendMode, searchable]);

  // Frontend Sort
  const sortedData = useMemo(() => {
    if (backendMode || !sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;

      return 0;
    });
  }, [filteredData, sortField, sortOrder, backendMode]);

  const pageSize = pagination?.pageSize ?? defaultPageSize;
  const currentPage = pagination?.page ?? internalPage;
  const setPage = (page: number) => {
    if (pagination?.onPageChange) pagination.onPageChange(page);
    else setInternalPage(page);
  };

  const frontendTotal = sortedData.length;
  const frontendTotalPages = Math.max(1, Math.ceil(frontendTotal / pageSize));

  // Frontend Pagination slice — only when NOT backendMode and pagination is provided
  // for rare offline/local lists. Prefer server-side (backendMode) pagination.
  const paginatedData = useMemo(() => {
    if (backendMode) return data;
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [backendMode, data, sortedData, pagination, currentPage, pageSize]);

  const displayData = backendMode ? data : paginatedData;

  const totalItems = backendMode
    ? (pagination?.total ?? data.length)
    : frontendTotal;

  const totalPages = backendMode
    ? Math.max(
        1,
        pagination?.total != null
          ? Math.ceil(pagination.total / pageSize)
          : currentPage + (pagination?.hasMore ? 1 : 0),
      )
    : frontendTotalPages;

  const canGoPrev = currentPage > 1;
  const canGoNext = backendMode
    ? pagination?.total != null
      ? currentPage < Math.max(1, Math.ceil(pagination.total / pageSize))
      : Boolean(pagination?.hasMore)
    : currentPage < frontendTotalPages;

  // Only show pager when explicitly configured (server-side) or local pagination prop.
  const showPagination = Boolean(pagination);

  // Keep internal page in range when data shrinks
  useEffect(() => {
    if (!backendMode && !pagination && internalPage > frontendTotalPages) {
      setInternalPage(frontendTotalPages);
    }
  }, [backendMode, pagination, internalPage, frontendTotalPages]);

  const handleSort = (field: keyof T) => {
    const newOrder =
      sortField === field && sortOrder === "asc" ? "desc" : "asc";

    setSortField(field);
    setSortOrder(newOrder);

    if (backendMode) {
      onSort?.(field, newOrder);
    }
  };

  const primaryColumn = columns.find((c) => c.primary);

  const renderCellValue = (col: MobileColumn<T>, item: T) => {
    if (col.render) {
      const rendered = col.render(item[col.key], item);
      if (
        typeof rendered === "string" ||
        typeof rendered === "number" ||
        rendered == null
      ) {
        return (
          <Text
            className="font-medium text-textPrimary text-right"
            numberOfLines={4}
          >
            {rendered == null ? "—" : String(rendered)}
          </Text>
        );
      }
      return <View className="flex-1 items-end">{rendered}</View>;
    }

    return (
      <Text
        className="font-medium text-textPrimary text-right"
        numberOfLines={4}
      >
        {cellText(item[col.key])}
      </Text>
    );
  };

  return (
    <View className="flex-1 gap-3 px-1">
      {/* Search / filter */}
      {(searchable || onFilterPress) && (
        <View className="mb-2 flex-row items-center gap-2">
          {searchable ? (
            <View className="flex-1">
              <AppInput
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
                size="sm"
              />
            </View>
          ) : (
            <View className="flex-1" />
          )}

          {onFilterPress && (
            <TouchableOpacity
              onPress={onFilterPress}
              className="h-12 w-12 rounded-xl border border-gray-200 bg-white items-center justify-center"
            >
              <AppIcon name="options-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sort Buttons */}
      {sortable && (
        <View className="mb-3 flex-row flex-wrap gap-2">
          {columns
            .filter((col) => col.sortable)
            .map((col) => (
              <TouchableOpacity
                key={String(col.key)}
                onPress={() => handleSort(col.key)}
                className="rounded-full bg-gray-200 px-3 py-2"
              >
                <Text numberOfLines={1}>
                  {col.label}
                  {sortField === col.key
                    ? sortOrder === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Loading */}
      {loading && data.length === 0 ? (
        <View>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 96 }}
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          renderItem={({ item }) => (
            <Card className="px-4 py-3 mb-3">
              {/* Header */}
              <View className="mb-3 flex-row items-start justify-between gap-2">
                <View className="flex-1 min-w-0 pr-2">
                  {primaryColumn
                    ? (() => {
                        const raw = primaryColumn.render
                          ? primaryColumn.render(
                              item[primaryColumn.key],
                              item,
                            )
                          : cellText(item[primaryColumn.key]);
                        if (
                          typeof raw === "string" ||
                          typeof raw === "number"
                        ) {
                          return (
                            <Text
                              className="text-base font-bold text-textPrimary"
                              numberOfLines={3}
                            >
                              {String(raw)}
                            </Text>
                          );
                        }
                        return <View className="w-full">{raw}</View>;
                      })()
                    : null}
                </View>
                {renderActions ? (
                  <View className="shrink-0">{renderActions(item)}</View>
                ) : null}
              </View>

              {/* Secondary Fields */}
              {columns
                .filter((col) => !col.primary && !col.hidden)
                .map((col) => (
                  <View
                    key={String(col.key)}
                    className="mb-1.5 flex-row items-start justify-between gap-3"
                  >
                    <Text
                      className="text-gray-500 text-sm shrink-0 max-w-[38%]"
                      numberOfLines={2}
                    >
                      {col.label}
                    </Text>
                    <View className="flex-1 min-w-0 items-end">
                      {renderCellValue(col, item)}
                    </View>
                  </View>
                ))}
            </Card>
          )}
          ListFooterComponent={
            <>
              {loading && data.length > 0 ? (
                <ActivityIndicator className="my-4" />
              ) : null}

              {showPagination ? (
                <View className="mt-2 mb-4 flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <TouchableOpacity
                    disabled={!canGoPrev}
                    onPress={() => setPage(Math.max(1, currentPage - 1))}
                    className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
                      canGoPrev ? "bg-primary/10" : "bg-slate-100 opacity-50"
                    }`}
                  >
                    <AppIcon
                      name="chevron-back"
                      size={16}
                      color={canGoPrev ? "#453956" : "#94A3B8"}
                    />
                    <Text
                      className={`text-sm font-semibold ${
                        canGoPrev ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      Prev
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-1 items-center px-1">
                    <Text
                      className="text-sm font-semibold text-textPrimary"
                      numberOfLines={1}
                    >
                      Page {currentPage}
                      {pagination?.total != null || !backendMode
                        ? ` of ${totalPages}`
                        : ""}
                    </Text>
                    <Text
                      className="text-[11px] text-textSecondary mt-0.5"
                      numberOfLines={1}
                    >
                      {totalItems} item{totalItems === 1 ? "" : "s"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={!canGoNext}
                    onPress={() => setPage(currentPage + 1)}
                    className={`flex-row items-center gap-1 rounded-xl px-3 py-2 ${
                      canGoNext ? "bg-primary/10" : "bg-slate-100 opacity-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        canGoNext ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      Next
                    </Text>
                    <AppIcon
                      name="chevron-forward"
                      size={16}
                      color={canGoNext ? "#453956" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          }
        />
      )}
    </View>
  );
}
