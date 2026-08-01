import { useDeleteTower, useGetTowers } from "@/src/api/tower.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { TowerResponse } from "@/src/types/tower.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function TowerManagement() {
  const { user, buildingId } = useAuth();
  const [deleteItem, setDeleteItem] = useState<TowerResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useGetTowers(
    { page, limit: PAGE_SIZE, search: search || undefined, buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { mutate: deleteMutate, isPending } = useDeleteTower();
  const { items, total } = extractPaginatedList<TowerResponse>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<TowerResponse>[] = [
    { key: "name", label: "Name", primary: true, searchable: true },
    { key: "description", label: "Description" },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="business" title="Tower Management" subtitle="Manage building towers." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => router.push("/(private)/tower-management/tower-add-edit")}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<TowerResponse>
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
            emptyMessage="No towers found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({
                        pathname: "/(private)/tower-management/tower-add-edit",
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
        title="Delete Tower"
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
