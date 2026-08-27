import {
  useDeleteTrade,
  useGetTrades,
} from "@/src/api/tradeDirectory.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { TradeDirectoryResponse } from "@/src/types/tradeDirectory.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function TradeDirectory() {
  const { user } = useAuth();
  const [deleteItem, setDeleteItem] = useState<TradeDirectoryResponse | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useGetTrades(
    { page, limit: PAGE_SIZE, search: search || undefined },
    !!user?.userId,
  );
  const { mutate: deleteMutate, isPending } = useDeleteTrade();
  const { items, total } = extractPaginatedList<TradeDirectoryResponse>(data, {
    page,
    limit: PAGE_SIZE,
  });

  const columns: MobileColumn<TradeDirectoryResponse>[] = [
    { key: "name", label: "Name", primary: true, searchable: true },
    { key: "company", label: "Company" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="briefcase"
          title="Trade Directory"
          subtitle="Manage trades and technicians."
        />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable
            onPress={() =>
              router.push("/(private)/trade-directory/trade-directory-add-edit")
            }
          >
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<TradeDirectoryResponse>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No trades found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({
                        pathname:
                          "/(private)/trade-directory/trade-directory-add-edit",
                        params: { id: String(row.id) },
                      }),
                  },
                  {
                    label: "Delete",
                    icon: "trash",
                    danger: true,
                    onPress: () => setDeleteItem(row),
                  },
                ]}
              />
            )}
          />
        </View>
      </View>
      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Trade"
        message={`Are you sure you want to delete "${deleteItem?.name}"?`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => {
          if (!deleteItem) return;
          deleteMutate({ id: deleteItem.id } as any, {
            onSuccess: () => {
              setDeleteItem(null);
              refetch();
            },
            onError: () => setDeleteItem(null),
          });
        }}
      />
    </>
  );
}
