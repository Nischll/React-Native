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
import AppInput from "../ui/AppInput";

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
}: MobileDataListProps<T>) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof T>();
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Debounce Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (backendMode) {
        onSearch?.(search);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [search]);

  // Frontend Search
  const filteredData = useMemo(() => {
    if (backendMode || !searchable) return data;

    return data.filter((row) =>
      columns.some((col) => {
        if (!col.searchable) return false;

        const value = row[col.key];
        return String(value).toLowerCase().includes(search.toLowerCase());
      }),
    );
  }, [data, search, columns]);

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
  }, [filteredData, sortField, sortOrder]);

  // Frontend Pagination
  const paginatedData = useMemo(() => {
    if (backendMode || !pagination) return sortedData;

    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const displayData = backendMode ? data : paginatedData;

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

  return (
    <View className="flex-1 gap-3">
      {/* Search */}
      {searchable && (
        <AppInput
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
          // className="mb-3"
          size="sm"
        />
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
                <Text>
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
          onEndReached={() => {
            if (backendMode && pagination?.hasMore) {
              pagination.onPageChange?.(pagination.page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
              {/* Header */}
              <View className="mb-3 flex-row items-center justify-between">
                {/* Primary Field */}
                <View className="flex-1 pr-3">
                  {primaryColumn && (
                    <Text className="text-lg font-bold">
                      {primaryColumn.render
                        ? primaryColumn.render(item[primaryColumn.key], item)
                        : String(item[primaryColumn.key])}
                    </Text>
                  )}
                </View>

                {/* Action Menu */}
                <View>{renderActions && renderActions(item)}</View>
              </View>

              {/* Secondary Fields */}
              {columns
                .filter((col) => !col.primary && !col.hidden)
                .map((col) => (
                  <View
                    key={String(col.key)}
                    className="mb-1 flex-row justify-between"
                  >
                    <Text className="text-gray-500">{col.label}</Text>

                    <Text className="font-medium text-right flex-1 ml-4">
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key])}
                    </Text>
                  </View>
                ))}
            </View>
          )}
          ListFooterComponent={
            loading && data.length > 0 ? (
              <ActivityIndicator className="my-4" />
            ) : null
          }
        />
      )}
    </View>
  );
}
